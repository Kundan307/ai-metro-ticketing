import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { registerSchema, loginSchema, bookTicketSchema, topUpSchema, scanTicketSchema, updateProfileSchema } from "@shared/schema";
import QRCode from "qrcode";
import crypto from "crypto";
import memorystore from "memorystore";

const MemoryStore = memorystore(session);

declare module "express-session" {
  interface SessionData {
    userId: number;
    chatHistory?: { role: string; content: string }[];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session.userId) return res.status(401).json({ message: "Please log in" });
  const user = await storage.getUserById(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

async function requireScanner(req: Request, res: Response, next: Function) {
  if (!req.session.userId) return res.status(401).json({ message: "Please log in" });
  const user = await storage.getUserById(req.session.userId);
  if (!user || (user.role !== "scanner" && user.role !== "admin")) {
    return res.status(403).json({ message: "Scanner or Admin access required" });
  }
  next();
}

function getDemandLevel(hour: number, crowdLevel: string): string {
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
  if (isPeak && crowdLevel === "high") return "high";
  if (isPeak || crowdLevel === "medium") return "medium";
  return "low";
}

function getPricingMultiplier(demandLevel: string): number {
  switch (demandLevel) {
    case "high": return 1.20;
    case "medium": return 1.10;
    default: return 1.00;
  }
}

function getRecommendation(demandLevel: string): string {
  if (demandLevel === "high") {
    const offPeakHours = [11, 12, 13, 14, 15];
    const suggestedHour = offPeakHours[Math.floor(Math.random() * offPeakHours.length)];
    return `High demand detected. Consider traveling at ${suggestedHour}:00 for lower fares and less crowding.`;
  }
  if (demandLevel === "medium") {
    return `Moderate demand. Off-peak hours (11 AM - 3 PM) offer better rates.`;
  }
  return `Low demand - great time to travel! You're getting the best fare.`;
}

function calculateBaseFare(sourceOrder: number, destOrder: number): number {
  const distance = Math.abs(sourceOrder - destOrder);
  return Math.max(10, distance * 5);
}

// ── Main Routing ─────────────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "metro-secret-key-dev",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  // ── Rule-Based Text Assistant (No API Needed) ──
  app.post("/api/assistant", async (req, res) => {
    try {
      const { message, conversationState } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const allStations = await storage.getAllStations();
      const msgLower = message.toLowerCase();
      
      let aiResult = {
        reply: "I am the SmartAI Metro Assistant. How can I help you today?",
        suggestions: ["Next train timing", "Plan a route", "Book a ticket", "Crowd levels"],
        action: "none",
        nextState: conversationState || {}
      };

      // 1. Check for Greetings
      if (msgLower.match(/\b(hi|hello|hey|greetings)\b/)) {
        aiResult.reply = "Hello! Welcome to Bangalore Namma Metro. Are you looking to book a ticket, check timings, or see crowd levels?";
      
      // 2. Check for Crowd Levels
      } else if (msgLower.includes("crowd") || msgLower.includes("busy")) {
        const purpleCrowd = allStations.filter(s => s.line === "purple" && s.crowdLevel === "high").length;
        const greenCrowd = allStations.filter(s => s.line === "green" && s.crowdLevel === "high").length;
        aiResult.reply = `Right now, the Purple Line has ${purpleCrowd} busy stations and the Green Line has ${greenCrowd} busy stations. Majestic is generally quite busy.`;
        aiResult.suggestions = ["Book a ticket instead"];
        
      // 3. Check for Timings
      } else if (msgLower.includes("time") || msgLower.includes("next train") || msgLower.includes("hours")) {
        aiResult.reply = "Metro trains operate from 5:00 AM to 11:00 PM daily. Trains run every 5-10 minutes depending on peak hours.";
      
      // 4. Check for Pricing/Fares
      } else if (msgLower.includes("price") || msgLower.includes("fare") || msgLower.includes("cost") || msgLower.includes("ticket price")) {
        aiResult.reply = "The base fare is ₹10 for the first 2 stations, plus ₹5 per station after that. Maximum fare is ~₹60. Surge pricing (up to 20%) applies during peak hours (8-10 AM, 5-7 PM).";
      
      // 5. Check for Ticket Booking
      } else if (msgLower.includes("book") || msgLower.includes("ticket")) {
        aiResult.reply = "Sure! I can help you book a ticket. Where would you like to depart from and where are you going?";
        aiResult.action = "none";
        
      // 6. Station Search / Route parsing (very basic)
      } else {
        // Attempt to find source/destination from the message if they mentioned stations
        let foundStations = [];
        for (const station of allStations) {
          if (msgLower.includes(station.name.toLowerCase())) {
            foundStations.push(station);
          }
        }
        
        if (foundStations.length === 2) {
           aiResult.reply = `Perfect! Preparing a ticket from ${foundStations[0].name} to ${foundStations[1].name}. Number of passengers?`;
           aiResult.nextState.sourceStation = { id: foundStations[0].id, name: foundStations[0].name };
           aiResult.nextState.destStation = { id: foundStations[1].id, name: foundStations[1].name };
           
        } else if (foundStations.length === 1 && aiResult.nextState?.sourceStation) {
           aiResult.reply = `Great! Setting destination to ${foundStations[0].name} from ${aiResult.nextState.sourceStation.name}. How many people?`;
           aiResult.nextState.destStation = { id: foundStations[0].id, name: foundStations[0].name };
           
        } else if (foundStations.length === 1) {
           aiResult.reply = `I see you mentioned ${foundStations[0].name}. Is that your starting point or destination?`;
           aiResult.nextState.sourceStation = { id: foundStations[0].id, name: foundStations[0].name };
           
        } else if (msgLower.match(/\b([1-9]|one|two|three|four)\b/) && aiResult.nextState?.sourceStation && aiResult.nextState?.destStation) {
           aiResult.reply = `Fantastic! I will set up your ticket for ${aiResult.nextState.sourceStation.name} to ${aiResult.nextState.destStation.name}. Please proceed with booking.`;
           aiResult.action = "book";
        } else {
           aiResult.reply = "I'm a simple assistant without Gemini. I can help you with Timings, Fares, or checking Crowd Levels. Just ask!";
           aiResult.suggestions = ["Timings", "Fares", "Crowd Levels", "Book ticket"];
        }
      }

      // Add to session history
      const history = req.session.chatHistory || [];
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: aiResult.reply });
      req.session.chatHistory = history.slice(-10);

      res.json(aiResult);
    } catch (error: any) {
      console.error("Local Assistant Error:", error);
      res.status(500).json({ reply: "My circuits are currently crossing wires. Please try again!" });
    }
  });

  // ── Auth Routes ──
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) return res.status(400).json({ message: "An account with this email already exists" });
      
      const hashedPassword = crypto.createHash("sha256").update(parsed.password).digest("hex");
      let role = (parsed.adminSecret === process.env.ADMIN_SECRET && parsed.role) ? parsed.role : "user";

      const user = await storage.createUser({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        password: hashedPassword,
        role: role,
      });
      await storage.updateWalletBalance(user.id, 500);
      await storage.createWalletTransaction(user.id, 500, "credit", "Welcome bonus!");
      req.session.userId = user.id;
      const updatedUser = await storage.getUserById(user.id);
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, walletBalance: 500 });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(parsed.email);
      const hashedPassword = crypto.createHash("sha256").update(parsed.password).digest("hex");
      if (!user || user.password !== hashedPassword) return res.status(401).json({ message: "Invalid email or password" });
      
      req.session.userId = user.id;
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => { req.session.destroy(() => res.json({ message: "Logged out" })); });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not logged in" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  // ── Wallet Routes ──
  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    res.json({ balance: user!.walletBalance });
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    try {
      const parsed = topUpSchema.parse(req.body);
      const user = await storage.getUserById(req.session.userId!);
      const newBalance = user!.walletBalance + parsed.amount;
      await storage.updateWalletBalance(user!.id, newBalance);
      await storage.createWalletTransaction(user!.id, parsed.amount, "credit", `Wallet top-up`);
      res.json({ balance: newBalance });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Top-up failed" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    res.json(await storage.getWalletTransactions(req.session.userId!));
  });

  // ── Ticketing Routes ──
  app.get("/api/stations", async (_req, res) => { res.json(await storage.getAllStations()); });

  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const parsed = bookTicketSchema.parse(req.body);
      const source = await storage.getStation(parsed.sourceStationId);
      const dest = await storage.getStation(parsed.destStationId);
      if (!source || !dest) return res.status(404).json({ message: "Station not found" });

      const hour = new Date().getHours();
      const demandLevel = getDemandLevel(hour, dest.crowdLevel);
      const multiplier = getPricingMultiplier(demandLevel);
      const baseFare = calculateBaseFare(source.orderIndex, dest.orderIndex);
      const dynamicFare = Math.round(baseFare * multiplier);
      const totalFare = dynamicFare * parsed.passengers;

      if (parsed.paymentMethod === "wallet") {
        const user = await storage.getUserById(req.session.userId!);
        if (!user || user.walletBalance < totalFare) return res.status(400).json({ message: "Insufficient balance" });
        await storage.updateWalletBalance(user.id, user.walletBalance - totalFare);
      }

      const ticket = await storage.createTicket({
        userId: req.session.userId!,
        ...parsed,
        sourceName: source.name,
        destName: dest.name,
        baseFare,
        dynamicFare,
        totalFare,
        pricingMultiplier: multiplier,
        demandLevel,
        status: "active",
        qrData: null,
      });

      const qrPayload = JSON.stringify({ ticketId: ticket.id, source: source.name, dest: dest.name, totalFare });
      const qrDataUrl = await QRCode.toDataURL(qrPayload);
      await storage.updateTicket(ticket.id, { qrData: qrPayload });

      res.json({ ticket, qrDataUrl });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Booking failed" });
    }
  });

  app.get("/api/tickets/my", requireAuth, async (req, res) => { res.json(await storage.getUserTickets(req.session.userId!)); });

  app.post("/api/scan", requireScanner, async (req, res) => {
    try {
      const parsed = scanTicketSchema.parse(req.body);
      const ticket = await storage.getTicket(parsed.ticketId);
      if (!ticket) return res.json({ valid: false, message: "Ticket not found" });

      const entryCount = ticket.entryCount ?? 0;
      const scanType = parsed.scanType || (entryCount < ticket.passengers ? "entry" : "exit");

      if (scanType === "entry" && entryCount >= ticket.passengers) return res.json({ valid: false, message: "All passengers already entered" });
      
      if (scanType === "entry") {
        await storage.updateTicket(ticket.id, { entryCount: entryCount + 1, scannedAt: new Date() });
      } else {
        const exitCount = (ticket.exitCount ?? 0) + 1;
        await storage.updateTicket(ticket.id, { exitCount, status: exitCount >= ticket.passengers ? "used" : "active" });
      }

      res.json({ valid: true, message: "Scan successful" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Scan failed" });
    }
  });

  // ── Admin Routes ──
  app.get("/api/admin/stats", requireAdmin, async (_req, res) => { res.json(await storage.getLivePassengerStats()); });
  app.get("/api/scans/recent", requireAdmin, async (_req, res) => { res.json(await storage.getRecentScans(20)); });

  // ── Insights ──
  app.get("/api/insights", async (_req, res) => {
    const allStations = await storage.getAllStations();
    const recommendations = [
      { type: "timing", title: "Best Travel Window", description: "Travel between 11 AM - 2 PM for lowest fares.", impact: "Save 20%" },
    ];
    res.json({ recommendations, stations: allStations.slice(0, 5) });
  });

  return httpServer;
}
