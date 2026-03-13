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
  }
}

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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      const hashedPassword = crypto.createHash("sha256").update(parsed.password).digest("hex");
      let role = "user";
      if (parsed.adminSecret === process.env.ADMIN_SECRET && parsed.role) {
        role = parsed.role; // Allow promoting to admin or scanner if secret matches
      }

      const user = await storage.createUser({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        password: hashedPassword,
        role: role,
      });
      await storage.updateWalletBalance(user.id, 500);
      await storage.createWalletTransaction(user.id, 500, "credit", "Welcome bonus - free credits to start your metro journey!");
      req.session.userId = user.id;
      const updatedUser = await storage.getUserById(user.id);
      res.json({
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        phone: updatedUser!.phone,
        role: updatedUser!.role,
        walletBalance: updatedUser!.walletBalance,
        createdAt: updatedUser!.createdAt,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(parsed.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const hashedPassword = crypto.createHash("sha256").update(parsed.password).digest("hex");
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      walletBalance: user.walletBalance,
      createdAt: user.createdAt,
    });
  });

  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updates: { name?: string; phone?: string; password?: string } = {};
      if (parsed.name) updates.name = parsed.name;
      if (parsed.phone) updates.phone = parsed.phone;

      if (parsed.newPassword) {
        if (!parsed.currentPassword) {
          return res.status(400).json({ message: "Current password is required to change password" });
        }
        const currentHash = crypto.createHash("sha256").update(parsed.currentPassword).digest("hex");
        if (currentHash !== user.password) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        updates.password = crypto.createHash("sha256").update(parsed.newPassword).digest("hex");
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No changes provided" });
      }

      const updated = await storage.updateUserProfile(user.id, updates);
      res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        walletBalance: updated.walletBalance,
        createdAt: updated.createdAt,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Profile update failed" });
    }
  });

  app.post("/api/tickets/:ticketId/cancel", requireAuth, async (req, res) => {
    try {
      const ticketId = Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });
      if (ticket.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not your ticket" });
      }
      if (ticket.status !== "active") {
        return res.status(400).json({ message: `Cannot cancel a ${ticket.status} ticket` });
      }

      const cancelled = await storage.cancelTicketIfActive(ticket.id);
      if (!cancelled) {
        return res.status(400).json({ message: "Ticket already cancelled or used" });
      }

      let refunded = false;
      let refundAmount = 0;
      if (ticket.paymentMethod === "wallet") {
        const user = await storage.getUserById(req.session.userId!);
        if (user) {
          refundAmount = ticket.totalFare;
          await storage.updateWalletBalance(user.id, user.walletBalance + refundAmount);
          await storage.createWalletTransaction(
            user.id,
            refundAmount,
            "credit",
            `Refund: ${ticket.sourceName} → ${ticket.destName} (cancelled)`
          );
          refunded = true;
        }
      }

      const updatedTicket = await storage.getTicket(ticket.id);
      const user = await storage.getUserById(req.session.userId!);
      res.json({
        ticket: updatedTicket,
        walletBalance: user?.walletBalance,
        refunded,
        refundAmount,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Cancellation failed" });
    }
  });

  app.get("/api/wallet/balance", requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    res.json({ balance: user!.walletBalance });
  });

  app.post("/api/wallet/topup", requireAuth, async (req, res) => {
    try {
      const parsed = topUpSchema.parse(req.body);
      const user = await storage.getUserById(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });
      const newBalance = user.walletBalance + parsed.amount;
      await storage.updateWalletBalance(user.id, newBalance);
      await storage.createWalletTransaction(user.id, parsed.amount, "credit", `Wallet top-up via UPI`);
      res.json({ balance: newBalance });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Top-up failed" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    const transactions = await storage.getWalletTransactions(req.session.userId!);
    res.json(transactions);
  });

  app.get("/api/stations", async (_req, res) => {
    const allStations = await storage.getAllStations();
    res.json(allStations);
  });

  app.get("/api/pricing/:sourceId/:destId", async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      const destId = parseInt(req.params.destId);
      const source = await storage.getStation(sourceId);
      const dest = await storage.getStation(destId);
      if (!source || !dest) return res.status(404).json({ message: "Station not found" });

      const hour = new Date().getHours();
      const demandLevel = getDemandLevel(hour, dest.crowdLevel);
      const multiplier = getPricingMultiplier(demandLevel);
      const baseFare = calculateBaseFare(source.orderIndex, dest.orderIndex);
      const dynamicFare = Math.round(baseFare * multiplier);
      const recommendation = getRecommendation(demandLevel);

      res.json({ baseFare, dynamicFare, multiplier, demandLevel, recommendation });
    } catch {
      res.status(500).json({ message: "Failed to calculate pricing" });
    }
  });

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
        if (!user || user.walletBalance < totalFare) {
          return res.status(400).json({ message: `Insufficient wallet balance. Need ${totalFare}, have ${user?.walletBalance ?? 0}` });
        }
        await storage.updateWalletBalance(user.id, user.walletBalance - totalFare);
        await storage.createWalletTransaction(user.id, -totalFare, "debit", `Ticket: ${source.name} → ${dest.name} (${parsed.passengers} passenger${parsed.passengers > 1 ? 's' : ''})`);
      }

      const securityHash = crypto
        .createHash("sha256")
        .update(`${req.session.userId}:${source.name}:${dest.name}:${totalFare}:${Date.now()}`)
        .digest("hex")
        .substring(0, 16);

      const platformFor = (line: string) => line === "purple" ? 1 : 2;
      const sourcePlatform = platformFor(source.line);
      const destPlatform = platformFor(dest.line);
      const hasTransfer = source.line !== dest.line;
      const transferStation = hasTransfer ? "Kempegowda Majestic" : null;
      const transferFromPlatform = hasTransfer ? sourcePlatform : null;
      const transferToPlatform = hasTransfer ? destPlatform : null;

      const ticket = await storage.createTicket({
        userId: req.session.userId!,
        sourceStationId: parsed.sourceStationId,
        destStationId: parsed.destStationId,
        sourceName: source.name,
        destName: dest.name,
        passengers: parsed.passengers,
        baseFare,
        dynamicFare,
        totalFare,
        pricingMultiplier: multiplier,
        demandLevel,
        paymentMethod: parsed.paymentMethod,
        status: "active",
        qrData: null,
        isFraudulent: false,
        fraudReason: null,
        sourcePlatform,
        destPlatform,
        hasTransfer,
        transferStation,
        transferFromPlatform,
        transferToPlatform,
        scannedAt: null,
      });

      const qrPayload = JSON.stringify({
        ticketId: ticket.id,
        source: source.name,
        destination: dest.name,
        sourcePlatform,
        destPlatform,
        transfer: hasTransfer ? { station: transferStation, from: transferFromPlatform, to: transferToPlatform } : null,
        passengers: parsed.passengers,
        fare: totalFare,
        timestamp: ticket.createdAt,
        hash: securityHash,
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      await storage.updateTicket(ticket.id, { qrData: qrPayload });

      const user = await storage.getUserById(req.session.userId!);
      res.json({ ticket, qrDataUrl, walletBalance: user?.walletBalance });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to book ticket" });
    }
  });

  app.get("/api/tickets/my", requireAuth, async (req, res) => {
    const tickets = await storage.getUserTickets(req.session.userId!);
    res.json(tickets);
  });

  app.post("/api/scan", requireScanner, async (req, res) => {
    try {
      const parsed = scanTicketSchema.parse(req.body);
      const ticketId = Array.isArray(parsed.ticketId) ? parsed.ticketId[0] : parsed.ticketId;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) return res.json({ valid: false, fraudDetected: false, message: "Ticket not found" });

      const pax = ticket.passengers;
      const entryCount = ticket.entryCount ?? 0;
      const exitCount = ticket.exitCount ?? 0;

      // Determine scan type: entry if not all passengers have entered yet, else exit
      const scanType = parsed.scanType || (entryCount < pax ? "entry" : "exit");
      const stationId = parsed.stationId || (scanType === "entry" ? ticket.sourceStationId : ticket.destStationId);

      let fraudDetected = false;
      let fraudReason: string | undefined;

      if (ticket.isFraudulent) {
        fraudDetected = true;
        fraudReason = ticket.fraudReason || "Ticket flagged as fraudulent";
      } else if (ticket.status === "used") {
        fraudDetected = true;
        fraudReason = "All passengers have already exited — ticket fully used";
      } else if (scanType === "exit" && entryCount === 0) {
        fraudDetected = true;
        fraudReason = "Exit scan attempted without any entry scan";
      } else if (scanType === "exit" && exitCount >= entryCount) {
        fraudDetected = true;
        fraudReason = "More exit scans than entry scans detected";
      } else if (scanType === "entry" && entryCount >= pax) {
        fraudDetected = true;
        fraudReason = `All ${pax} passenger(s) already entered — no more entry scans allowed`;
      } else if (scanType === "exit" && ticket.scannedAt) {
        const timeSinceEntry = Date.now() - new Date(ticket.scannedAt).getTime();
        if (timeSinceEntry < 2 * 60 * 1000) {
          fraudDetected = true;
          fraudReason = "Impossible travel time (< 2 min since entry)";
        }
      }

      if (fraudDetected) {
        await storage.updateTicket(ticketId, { isFraudulent: true, fraudReason });
      } else if (scanType === "entry") {
        const newEntryCount = entryCount + 1;
        await storage.updateTicket(ticketId, {
          entryCount: newEntryCount,
          scannedAt: entryCount === 0 ? new Date() : ticket.scannedAt, // record time of first entry
        });
      } else if (scanType === "exit") {
        const newExitCount = exitCount + 1;
        const allDone = newExitCount >= pax;
        await storage.updateTicket(ticketId, {
          exitCount: newExitCount,
          status: allDone ? "used" : "active",
        });
      }

      await storage.createScanLog({
        ticketId,
        stationId,
        scanType,
        result: fraudDetected ? "fraud" : "valid",
        fraudDetected,
        fraudReason: fraudReason || null,
      });

      const updatedTicket = await storage.getTicket(ticketId);
      const newEntry = (updatedTicket?.entryCount ?? 0);
      const newExit = (updatedTicket?.exitCount ?? 0);

      const successMsg = scanType === "entry"
        ? `Passenger ${newEntry} of ${pax} entered ✓ — ${pax - newEntry} remaining`
        : `Passenger ${newExit} of ${pax} exited ✓ — ${pax - newExit} remaining`;

      res.json({
        valid: !fraudDetected,
        fraudDetected,
        fraudReason,
        message: fraudDetected
          ? `⛔ BLOCKED: ${fraudReason}`
          : successMsg,
        ticket: updatedTicket ? {
          id: updatedTicket.id,
          sourceName: updatedTicket.sourceName,
          destName: updatedTicket.destName,
          totalFare: updatedTicket.totalFare,
          passengers: updatedTicket.passengers,
          status: updatedTicket.status,
          entryCount: updatedTicket.entryCount,
          exitCount: updatedTicket.exitCount,
        } : null,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Scan failed" });
    }
  });


  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getLivePassengerStats();
    res.json(stats);
  });

  app.get("/api/scans/recent", requireAdmin, async (_req, res) => {
    const scans = await storage.getRecentScans(20);
    res.json(scans);
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const lower = message.toLowerCase();
      const allStations = await storage.getAllStations();
      const purpleStations = allStations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
      const greenStations = allStations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);
      const hour = new Date().getHours();
      const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
      const isOperating = hour >= 5 && hour <= 23;

      // Find station mentions in message (match full name or first word)
      const matchedStations = allStations.filter((s) => {
        const words = s.name.toLowerCase().split(" ");
        return words.some((w) => w.length > 3 && lower.includes(w));
      });

      let reply = "";
      let suggestions: string[] = [];

      if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.match(/^(good|namaste|vannakam)/)) {
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        reply = `${greeting}! 👋 I'm your Namma Metro assistant.\n\nI can help you with:\n• Train timings & schedules\n• Route planning & platform info\n• Live crowd levels\n• Fare & pricing\n• Tickets, wallet & payments\n\nWhat would you like to know?`;
        suggestions = ["Next train timing", "How to plan a route?", "Current crowd levels", "Fare calculator"];

      } else if (lower.includes("timing") || lower.includes("next train") || lower.includes("when") || lower.includes("schedule") || lower.includes("frequency")) {
        const freq = isPeak ? "3–5 minutes" : "5–10 minutes";
        if (!isOperating) {
          reply = `Metro services have closed for today. 🌙\n\n• First train: 5:00 AM\n• Last train: 11:00 PM\n• Services run daily including weekends & holidays\n\nPlan your journey for tomorrow!`;
        } else {
          const nextMin = Math.floor(Math.random() * 5) + 1;
          reply = `Trains are running now! 🟢\n\n• Next train in: ~${nextMin} minute${nextMin > 1 ? "s" : ""}\n• Current frequency: every ${freq}\n• Peak hours (8–10 AM, 5–7 PM): every 3–5 min\n• Off-peak: every 5–10 min\n\n${isPeak ? "⚠️ It's peak hour — trains may be crowded." : "✅ Off-peak now — comfortable travel expected."}`;
        }
        suggestions = ["Check crowd levels", "Plan a route", "Operating hours", "Fare info"];

      } else if (lower.includes("platform") || lower.includes("which platform") || lower.includes("board")) {
        reply = `Platform information for Namma Metro:\n\n🟣 Purple Line → Platform 1\n🟢 Green Line → Platform 2\n\nAt Kempegowda Majestic (interchange station):\n• Board Purple Line trains from Platform 1\n• Board Green Line trains from Platform 2\n\nFor cross-line journeys, exit your train at Majestic and switch platforms. Your SmartAI Metro ticket will show the platform details automatically.`;
        suggestions = ["Route with transfer", "What is Majestic interchange?", "Train timings", "Book a ticket"];

      } else if (lower.includes("transfer") || lower.includes("interchange") || lower.includes("change") || lower.includes("majestic") || lower.includes("switch line")) {
        reply = `Kempegowda Majestic is the only interchange between both metro lines. 🔄\n\n• Purple Line: Platform 1\n• Green Line: Platform 2\n\nHow to transfer:\n1. Alight at Kempegowda Majestic\n2. Follow signs to Platform 2 (or 1)\n3. Board your connecting train\n\n⏱️ Allow ~3–5 extra minutes for the transfer.\n\nYour SmartAI ticket will mention this platform change.`;
        suggestions = ["Purple Line stations", "Green Line stations", "Book cross-line ticket", "Train frequency"];

      } else if ((lower.includes("route") || lower.includes("how to go") || lower.includes("how to get") || lower.includes("reach") || lower.includes("path") || lower.includes("travel from")) && matchedStations.length >= 2) {
        const src = matchedStations[0];
        const dst = matchedStations[1];
        const sameLine = src.line === dst.line;
        const srcLine = src.line === "purple" ? "Purple" : "Green";
        const dstLine = dst.line === "purple" ? "Purple" : "Green";
        const srcPlatform = src.line === "purple" ? 1 : 2;
        const dstPlatform = dst.line === "purple" ? 1 : 2;
        if (sameLine) {
          const stationCount = Math.abs(src.orderIndex - dst.orderIndex);
          const mins = stationCount * 2;
          const fare = Math.max(10, stationCount * 5);
          reply = `Route: ${src.name} → ${dst.name} 🗺️\n\n• Line: ${srcLine} Line (direct)\n• Platform: ${srcPlatform}\n• Stations: ${stationCount}\n• Duration: ~${mins} minutes\n• Estimated fare: ₹${fare}–₹${Math.round(fare * 1.2)}\n\nNo transfers needed — direct journey on the ${srcLine} Line!`;
        } else {
          const seg1 = Math.abs(src.orderIndex - (src.line === "purple" ? 14 : 8));
          const seg2 = Math.abs((dst.line === "purple" ? 14 : 8) - dst.orderIndex);
          const totalStations = seg1 + seg2;
          const totalMins = totalStations * 2 + 4;
          const fare = Math.max(10, totalStations * 5);
          reply = `Route: ${src.name} → ${dst.name} 🗺️\n\n• Segment 1: ${src.name} → Kempegowda Majestic\n  ${srcLine} Line, Platform ${srcPlatform}\n• Transfer: Switch to Platform ${dstPlatform} at Majestic\n• Segment 2: Kempegowda Majestic → ${dst.name}\n  ${dstLine} Line, Platform ${dstPlatform}\n\n• Total stations: ~${totalStations}\n• Duration: ~${totalMins} minutes\n• Estimated fare: ₹${fare}–₹${Math.round(fare * 1.2)}`;
        }
        suggestions = ["Book this ticket", "Check crowd now", "Train frequency", "Platform info"];

      } else if (lower.includes("route") || lower.includes("how to go") || lower.includes("travel") || lower.includes("reach")) {
        reply = `To plan a route, mention the stations you want to travel between!\n\nFor example: "How to go from Indiranagar to Nagasandra?"\n\nYou can also use the **Route Planner** page for detailed options with crowd analysis and best travel times.\n\nNamma Metro has 2 lines:\n🟣 Purple Line — ${purpleStations[0]?.name} to ${purpleStations[purpleStations.length - 1]?.name}\n🟢 Green Line — ${greenStations[0]?.name} to ${greenStations[greenStations.length - 1]?.name}`;
        suggestions = ["Purple Line stations", "Green Line stations", "Platform info", "Fare calculator"];

      } else if (lower.includes("fare") || lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("ticket price")) {
        const surgeNote = isPeak ? "\n⚠️ Peak hour surge (up to 20%) active now." : "\n✅ No surge pricing currently.";
        reply = `Namma Metro fare structure 💰\n\n• 1–2 stations: ₹10\n• Each extra station: +₹5\n• Maximum fare: ~₹60\n• Children under 3: Free\n\nDynamic pricing applies during peak hours (8–10 AM, 5–7 PM) — up to 20% higher.${surgeNote}\n\nExact fare is shown on the booking page before you pay.`;
        suggestions = ["Book a ticket", "Wallet & payments", "When is off-peak?", "Train timings"];

      } else if (lower.includes("crowd") || lower.includes("busy") || lower.includes("rush") || lower.includes("congestion") || lower.includes("packed") || lower.includes("empty")) {
        const highCrowd = allStations.filter((s) => s.crowdLevel === "high");
        const medCrowd = allStations.filter((s) => s.crowdLevel === "medium");
        const lowCrowd = allStations.filter((s) => s.crowdLevel === "low");
        const statusEmoji = highCrowd.length > 5 ? "🔴" : highCrowd.length > 2 ? "🟡" : "🟢";
        reply = `Live crowd status ${statusEmoji}\n\n🔴 High: ${highCrowd.length > 0 ? highCrowd.slice(0, 4).map((s) => s.name).join(", ") : "None"}\n🟡 Medium: ${medCrowd.length > 0 ? medCrowd.slice(0, 4).map((s) => s.name).join(", ") : "None"}\n🟢 Low: ${lowCrowd.length} stations currently uncrowded\n\n${isPeak ? "⚠️ Peak hours — expect higher crowds at major stations." : "✅ Good time to travel — relatively uncrowded."}\n\nTip: Best travel window is 11 AM – 3 PM.`;
        suggestions = ["Best time to travel", "Train frequency now", "Avoid busy stations", "Book a ticket"];

      } else if (lower.includes("hour") || lower.includes("open") || lower.includes("close") || lower.includes("operating") || lower.includes("service")) {
        reply = `Namma Metro operating hours 🕐\n\n• First train: 5:00 AM\n• Last train: 11:00 PM\n• Runs daily — weekdays, weekends & holidays\n\nFrequency:\n• Peak (8–10 AM, 5–7 PM): every 3–5 minutes\n• Off-peak: every 5–10 minutes\n\nCurrent status: ${isOperating ? "🟢 In service" : "🔴 Closed (reopens 5:00 AM)"}`;
        suggestions = ["Train timing now", "Current crowd levels", "Platform info", "Book a ticket"];

      } else if (lower.includes("purple line") || lower.includes("purple")) {
        reply = `Purple Line (Platform 1) 🟣\n\n• ${purpleStations.length} stations total\n• ${purpleStations[0]?.name} ↔ ${purpleStations[purpleStations.length - 1]?.name}\n• Connects: Baiyappanahalli, MG Road, Trinity, Indiranagar, Majestic, Rajajinagar, Mysore Road, Kengeri\n• Interchange at Kempegowda Majestic (connects to Green Line)\n\nPlatform 1 for all Purple Line trains.`;
        suggestions = ["Green Line info", "Platform info", "Plan a route", "Crowd on Purple Line"];

      } else if (lower.includes("green line") || lower.includes("green")) {
        reply = `Green Line (Platform 2) 🟢\n\n• ${greenStations.length} stations total\n• ${greenStations[0]?.name} ↔ ${greenStations[greenStations.length - 1]?.name}\n• Connects: Nagasandra, Yeshwanthpur, Majestic, Chickpete, Jayanagar, JP Nagar, Silk Institute\n• Interchange at Kempegowda Majestic (connects to Purple Line)\n\nPlatform 2 for all Green Line trains.`;
        suggestions = ["Purple Line info", "Platform info", "Plan a route", "Crowd on Green Line"];

      } else if (lower.includes("station") || lower.includes("list") || lower.includes("how many") || lower.includes("all station")) {
        reply = `Namma Metro has ${allStations.length} stations across 2 lines:\n\n🟣 Purple Line (${purpleStations.length} stations, Platform 1)\n${purpleStations[0]?.name} → ... → ${purpleStations[purpleStations.length - 1]?.name}\n\n🟢 Green Line (${greenStations.length} stations, Platform 2)\n${greenStations[0]?.name} → ... → ${greenStations[greenStations.length - 1]?.name}\n\nBoth lines interchange at Kempegowda Majestic.`;
        suggestions = ["Purple Line stations", "Green Line stations", "Plan a route", "Platform info"];

      } else if (lower.includes("wallet") || lower.includes("balance") || lower.includes("top up") || lower.includes("topup") || lower.includes("recharge") || lower.includes("add money")) {
        reply = `SmartAI Metro Digital Wallet 💳\n\n• Top up via UPI on the Wallet page\n• Minimum top-up: ₹50 | Maximum: ₹10,000\n• New users get ₹500 welcome bonus!\n• Wallet payments get instant refunds on cancellation\n\nWallet balance is always visible in the top bar. Tap it to go to the Wallet page.`;
        suggestions = ["How to book a ticket?", "Ticket cancellation", "Fare info", "Refund policy"];

      } else if (lower.includes("cancel") || lower.includes("refund")) {
        reply = `Ticket cancellation & refunds 🔄\n\n• Cancel from 'My Tickets' page\n• Only active (unused) tickets can be cancelled\n• Wallet payment → instant full refund\n• UPI payment → no refund (check T&C)\n\nTo cancel: My Tickets → tap 'Cancel Ticket'`;
        suggestions = ["Check My Tickets", "Wallet info", "Book a ticket", "Fare info"];

      } else if (lower.includes("accessibility") || lower.includes("wheelchair") || lower.includes("disabled") || lower.includes("differently abled") || lower.includes("lift") || lower.includes("elevator")) {
        reply = `Accessibility at Namma Metro ♿\n\n• All stations have lifts & ramps\n• Tactile paths for visually impaired\n• Dedicated coaches for differently-abled\n• Priority seating in every coach\n• Station staff available for assistance\n\nAccessibility Mode in our app increases text size and contrast for easier reading. Enable it from the Accessibility page.`;
        suggestions = ["Operating hours", "Train frequency", "Help me plan a route", "Book a ticket"];

      } else if (lower.includes("parking") || lower.includes("park") || lower.includes("two-wheeler") || lower.includes("car")) {
        reply = `Parking at Namma Metro 🅿️\n\n• Paid parking available at major stations\n• Two-wheeler & four-wheeler bays at terminal stations\n• Baiyappanahalli, Kengeri, Nagasandra, Silk Institute have dedicated parking\n• Average cost: ₹10–₹30 for 2-wheelers, ₹30–₹60 for cars\n\nRecommended: Park & Ride — park at terminal stations and metro in!`;
        suggestions = ["Station facilities", "Train timings", "Plan a route", "Fare info"];

      } else if (lower.includes("token") || lower.includes("smart card") || lower.includes("qr") || lower.includes("ticket type")) {
        reply = `Ticket options on Namma Metro 🎫\n\n1. **SmartAI QR Ticket** (this app)\n   • Instant digital ticket\n   • Show QR at gate — no physical token\n   • Supports multi-passenger\n\n2. **Metro Token** (at station counters)\n   • Single-journey physical token\n   • Purchased at station kiosks\n\n3. **Namma Metro Smart Card**\n   • Rechargeable card\n   • Faster entry at gates\n   • Available at metro counters\n\nFor convenience, use the SmartAI QR ticket right here!`;
        suggestions = ["Book a QR ticket", "Fare info", "Wallet & top-up", "How to use QR?"];

      } else if (lower.includes("book") || lower.includes("how to book") || lower.includes("purchase")) {
        reply = `How to book a SmartAI Metro ticket 🎫\n\n1. Go to **Book Ticket** (home page)\n2. Select your source & destination station\n3. Choose number of passengers (1–6)\n4. Review the AI-priced fare\n5. Pay via wallet or UPI\n6. Get your QR code instantly!\n\nShow the QR at the metro gate to enter. You can also download the QR from the booking confirmation screen.`;
        suggestions = ["Book now", "Wallet top-up", "Fare info", "Cancel a ticket"];

      } else if (lower.includes("help") || lower.includes("what can you") || lower.includes("options") || lower.includes("features")) {
        reply = `Here's what I can help you with 🤖\n\n🕐 Train timings & frequency\n🗺️ Route planning with platform info\n🟣🟢 Line & station information\n📊 Live crowd levels\n💰 Fares & dynamic pricing\n🎫 Booking & ticket help\n💳 Wallet & payment queries\n♿ Accessibility information\n🅿️ Parking & facilities\n\nJust ask me anything about Namma Metro!`;
        suggestions = ["Next train timing", "Plan a route", "Crowd levels now", "Fare calculator"];

      } else if (matchedStations.length === 1) {
        const s = matchedStations[0];
        const crowdEmoji = s.crowdLevel === "high" ? "🔴 High" : s.crowdLevel === "medium" ? "🟡 Medium" : "🟢 Low";
        const platform = s.line === "purple" ? 1 : 2;
        const lineLabel = s.line === "purple" ? "Purple" : "Green";
        reply = `${s.name} Station ℹ️\n\n• Line: ${lineLabel} Line\n• Platform: ${platform}\n• Current crowd: ${crowdEmoji}\n${s.name === "Kempegowda Majestic" ? "• This is the interchange station — connects both lines!\n• Purple Line: Platform 1\n• Green Line: Platform 2" : ""}\n\nWant to plan a journey from or to ${s.name}?`;
        suggestions = [`Route from ${s.name}`, "Check crowd levels", "Train timings", "Book a ticket"];

      } else {
        reply = `I can help with train timings, routes, platforms, fares, crowd info and more. 🤖\n\nTry asking:\n• "Next train to MG Road"\n• "How to go from Indiranagar to Nagasandra?"\n• "Which platform for Green Line?"\n• "Is it crowded at Majestic now?"`;
        suggestions = ["Train timings", "Plan a route", "Platform info", "Current crowd levels"];
      }

      res.json({ reply, suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Chatbot error" });
    }
  });

  // ── Voice Assistant: Conversational Booking ──────────────────────
  interface VoiceState {
    intent?: string;
    sourceStation?: { id: number; name: string };
    destStation?: { id: number; name: string };
    passengers?: number;
    paymentMethod?: string;
    awaitingConfirmation?: boolean;
  }

  function fuzzyMatchStation(
    text: string,
    stations: { id: number; name: string; line: string; orderIndex: number }[]
  ): { id: number; name: string } | null {
    const lower = text.toLowerCase();
    // Exact match first
    const exact = stations.find((s) => lower.includes(s.name.toLowerCase()));
    if (exact) return { id: exact.id, name: exact.name };
    // Word-level fuzzy match — match if any significant word of the station name is found
    for (const s of stations) {
      const words = s.name.toLowerCase().split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && lower.includes(w)) return { id: s.id, name: s.name };
      }
    }
    return null;
  }

  app.post("/api/voice-book", async (req, res) => {
    try {
      const { message, conversationState } = req.body as {
        message: string;
        conversationState?: VoiceState;
      };
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const lower = message.toLowerCase();
      const allStations = await storage.getAllStations();
      const state: VoiceState = conversationState || {};
      let reply = "";
      let action: string | undefined;
      let suggestions: string[] = [];
      let ticketData: any = undefined;

      // ── Intent detection ──
      const isGreet = /^(hi|hello|hey|good|namaste|help)/i.test(lower);
      const isBooking =
        lower.includes("book") ||
        lower.includes("ticket") ||
        lower.includes("travel") ||
        lower.includes("go to") ||
        lower.includes("go from") ||
        lower.includes("want to go");
      const isCancel = lower.includes("cancel") || lower.includes("stop") || lower.includes("never mind") || lower.includes("nevermind");
      const isYes = /^(yes|yeah|yep|confirm|ok|okay|sure|proceed|book it|do it|haan|ha)/i.test(lower.trim());
      const isNo = /^(no|nah|nope|don't|cancel|nahi)/i.test(lower.trim());

      // ── Handle cancel ──
      if (isCancel) {
        reply = "No problem! I've cancelled the booking. Feel free to start again whenever you're ready.";
        return res.json({ reply, nextState: {}, suggestions: ["Book a ticket", "Check crowd", "Train timings"] });
      }

      // ── Confirmation flow ──
      if (state.awaitingConfirmation) {
        if (isYes && state.sourceStation && state.destStation && state.passengers && state.paymentMethod) {
          // Actually book the ticket
          if (!req.session.userId) {
            reply = "You need to be logged in to book a ticket. Please log in and try again.";
            return res.json({ reply, nextState: {}, suggestions: ["Log in"] });
          }

          const source = await storage.getStation(state.sourceStation.id);
          const dest = await storage.getStation(state.destStation.id);
          if (!source || !dest) {
            reply = "Sorry, I couldn't find those stations. Let's start over.";
            return res.json({ reply, nextState: {}, suggestions: ["Book a ticket"] });
          }

          const hour = new Date().getHours();
          const demandLevel = getDemandLevel(hour, dest.crowdLevel);
          const multiplier = getPricingMultiplier(demandLevel);
          const baseFare = calculateBaseFare(source.orderIndex, dest.orderIndex);
          const dynamicFare = Math.round(baseFare * multiplier);
          const totalFare = dynamicFare * state.passengers;

          if (state.paymentMethod === "wallet") {
            const user = await storage.getUserById(req.session.userId);
            if (!user || user.walletBalance < totalFare) {
              reply = `Insufficient wallet balance. You need ₹${totalFare} but have ₹${user?.walletBalance ?? 0}. Please top up your wallet first.`;
              return res.json({ reply, nextState: {}, suggestions: ["Top up wallet", "Book with UPI"] });
            }
            await storage.updateWalletBalance(user.id, user.walletBalance - totalFare);
            await storage.createWalletTransaction(user.id, -totalFare, "debit",
              `Voice Booking: ${source.name} → ${dest.name} (${state.passengers} passenger${state.passengers > 1 ? "s" : ""})`
            );
          }

          const securityHash = crypto
            .createHash("sha256")
            .update(`${req.session.userId}:${source.name}:${dest.name}:${totalFare}:${Date.now()}`)
            .digest("hex")
            .substring(0, 16);

          const platformFor = (line: string) => line === "purple" ? 1 : 2;
          const sourcePlatform = platformFor(source.line);
          const destPlatform = platformFor(dest.line);
          const hasTransfer = source.line !== dest.line;
          const transferStation = hasTransfer ? "Kempegowda Majestic" : null;

          const ticket = await storage.createTicket({
            userId: req.session.userId,
            sourceStationId: source.id,
            destStationId: dest.id,
            sourceName: source.name,
            destName: dest.name,
            passengers: state.passengers,
            baseFare,
            dynamicFare,
            totalFare,
            pricingMultiplier: multiplier,
            demandLevel,
            paymentMethod: state.paymentMethod,
            status: "active",
            qrData: null,
            isFraudulent: false,
            fraudReason: null,
            sourcePlatform,
            destPlatform,
            hasTransfer,
            transferStation,
            transferFromPlatform: hasTransfer ? sourcePlatform : null,
            transferToPlatform: hasTransfer ? destPlatform : null,
            scannedAt: null,
          });

          const qrPayload = JSON.stringify({
            ticketId: ticket.id,
            source: source.name,
            destination: dest.name,
            sourcePlatform,
            destPlatform,
            passengers: state.passengers,
            fare: totalFare,
            timestamp: ticket.createdAt,
            hash: securityHash,
          });

          const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 300, margin: 2 });
          await storage.updateTicket(ticket.id, { qrData: qrPayload });
          const user = await storage.getUserById(req.session.userId);

          reply = `Your ticket has been booked! 🎉\n\n` +
            `📍 ${source.name} → ${dest.name}\n` +
            `👥 ${state.passengers} passenger${state.passengers > 1 ? "s" : ""}\n` +
            `💰 ₹${totalFare} via ${state.paymentMethod}\n\n` +
            `Your QR code is ready in My Tickets. Have a great journey!`;

          ticketData = { ticket, qrDataUrl, walletBalance: user?.walletBalance };
          return res.json({ reply, nextState: {}, action: "booked", ticketData, suggestions: ["Book another ticket", "View my tickets"] });

        } else if (isNo) {
          reply = "Booking cancelled. Would you like to start over or change something?";
          return res.json({ reply, nextState: { ...state, awaitingConfirmation: false }, suggestions: ["Change station", "Start over"] });
        } else {
          reply = "Please confirm — should I book this ticket? Say 'yes' to confirm or 'no' to cancel.";
          return res.json({ reply, nextState: state, suggestions: ["Yes, book it", "No, cancel"] });
        }
      }

      // ── Greeting ──
      if (isGreet && !state.intent) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        reply = `${greeting}! 👋 I'm your Namma Metro voice assistant.\n\nI can help you book tickets, check routes, and get metro info — all by voice!\n\nJust say something like "Book a ticket from Indiranagar to Majestic" to get started.`;
        suggestions = ["Book a ticket", "Train timings", "Crowd levels"];
        return res.json({ reply, nextState: { intent: "greeting" }, suggestions });
      }

      // ── Booking flow: try to extract stations from the message ──
      if (isBooking || state.intent === "booking") {
        const newState: VoiceState = { ...state, intent: "booking" };

        // Try to find source & destination from message
        if (!newState.sourceStation || !newState.destStation) {
          // Try to find two stations
          const matched: { id: number; name: string }[] = [];
          for (const s of allStations) {
            const words = s.name.toLowerCase().split(/\s+/);
            if (lower.includes(s.name.toLowerCase()) || words.some((w) => w.length > 3 && lower.includes(w))) {
              if (!matched.find((m) => m.id === s.id)) {
                matched.push({ id: s.id, name: s.name });
              }
            }
          }

          // "from X to Y" pattern — first mention is source, second is dest
          if (matched.length >= 2 && !newState.sourceStation && !newState.destStation) {
            newState.sourceStation = matched[0];
            newState.destStation = matched[1];
          } else if (matched.length === 1) {
            if (!newState.sourceStation) {
              newState.sourceStation = matched[0];
            } else if (!newState.destStation && matched[0].id !== newState.sourceStation.id) {
              newState.destStation = matched[0];
            }
          }
        }

        // Ask for missing slots
        if (!newState.sourceStation) {
          reply = "Sure, let's book a ticket! Which station are you starting from?";
          suggestions = ["Indiranagar", "Majestic", "MG Road", "Yeshwanthpur"];
          return res.json({ reply, nextState: newState, suggestions });
        }

        if (!newState.destStation) {
          reply = `Starting from ${newState.sourceStation.name}. Where would you like to go?`;
          suggestions = ["Majestic", "Nagasandra", "Silk Institute", "Kengeri"];
          return res.json({ reply, nextState: newState, suggestions });
        }

        if (newState.sourceStation.id === newState.destStation.id) {
          reply = "The source and destination can't be the same! Please tell me a different destination.";
          newState.destStation = undefined;
          return res.json({ reply, nextState: newState, suggestions: ["Majestic", "Indiranagar", "Jayanagar"] });
        }

        // Extract passengers from message
        if (!newState.passengers) {
          const numMatch = lower.match(/(\d+)\s*(passenger|people|person|ticket)/);
          const singleWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
          if (numMatch) {
            newState.passengers = Math.min(6, Math.max(1, parseInt(numMatch[1])));
          } else {
            for (const [word, num] of Object.entries(singleWords)) {
              if (lower.includes(word)) { newState.passengers = num; break; }
            }
          }
        }

        if (!newState.passengers) {
          reply = `${newState.sourceStation.name} → ${newState.destStation.name}. How many passengers? (1 to 6)`;
          suggestions = ["1 passenger", "2 passengers", "3 passengers"];
          return res.json({ reply, nextState: newState, suggestions });
        }

        // Extract payment method
        if (!newState.paymentMethod) {
          if (lower.includes("wallet")) newState.paymentMethod = "wallet";
          else if (lower.includes("upi")) newState.paymentMethod = "upi";
        }

        if (!newState.paymentMethod) {
          reply = `Got it — ${newState.passengers} passenger${newState.passengers > 1 ? "s" : ""}. How would you like to pay — wallet or UPI?`;
          suggestions = ["Wallet", "UPI"];
          return res.json({ reply, nextState: newState, suggestions });
        }

        // All slots filled — calculate fare and ask for confirmation
        const source = await storage.getStation(newState.sourceStation.id);
        const dest = await storage.getStation(newState.destStation.id);
        if (!source || !dest) {
          reply = "Sorry, I couldn't find those stations. Let's try again.";
          return res.json({ reply, nextState: {}, suggestions: ["Book a ticket"] });
        }

        const hour = new Date().getHours();
        const demandLevel = getDemandLevel(hour, dest.crowdLevel);
        const multiplier = getPricingMultiplier(demandLevel);
        const baseFare = calculateBaseFare(source.orderIndex, dest.orderIndex);
        const dynamicFare = Math.round(baseFare * multiplier);
        const totalFare = dynamicFare * newState.passengers;

        newState.awaitingConfirmation = true;

        reply = `Here's your booking summary:\n\n` +
          `📍 ${source.name} → ${dest.name}\n` +
          `👥 ${newState.passengers} passenger${newState.passengers > 1 ? "s" : ""}\n` +
          `💰 Total fare: ₹${totalFare} (via ${newState.paymentMethod})\n\n` +
          `Shall I confirm this booking?`;
        suggestions = ["Yes, book it", "No, cancel"];
        return res.json({ reply, nextState: newState, suggestions });
      }

      // ── Fallback: delegate to the existing chatbot logic ──
      // Forward to the regular chatbot patterns for non-booking queries
      const purpleStations = allStations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
      const greenStations = allStations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);
      const hour = new Date().getHours();
      const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
      const isOperating = hour >= 5 && hour <= 23;

      if (lower.includes("timing") || lower.includes("next train") || lower.includes("schedule")) {
        const freq = isPeak ? "3–5 minutes" : "5–10 minutes";
        reply = isOperating
          ? `Trains are running now. Current frequency: every ${freq}. ${isPeak ? "It's peak hour." : "Off-peak — comfortable travel."}`
          : `Metro is closed. First train at 5:00 AM, last at 11:00 PM.`;
        suggestions = ["Book a ticket", "Crowd levels", "Route info"];
      } else if (lower.includes("crowd") || lower.includes("busy")) {
        const highCrowd = allStations.filter((s) => s.crowdLevel === "high");
        reply = highCrowd.length > 0
          ? `High crowd at: ${highCrowd.slice(0, 4).map((s) => s.name).join(", ")}. ${isPeak ? "Peak hours active." : "Off-peak now."}`
          : `All stations are relatively uncrowded right now. Great time to travel!`;
        suggestions = ["Book a ticket", "Train timings", "Route info"];
      } else if (lower.includes("fare") || lower.includes("price") || lower.includes("cost")) {
        reply = `Fares start at ₹10 with ₹5 per additional station. Peak hours (8-10 AM, 5-7 PM) add up to 20% surge.`;
        suggestions = ["Book a ticket", "Train timings", "Crowd levels"];
      } else {
        reply = `I'm your voice assistant for Namma Metro! I can help you:\n\n• Book tickets — just say "Book a ticket"\n• Check train timings\n• Get crowd info\n• Know the fares\n\nWhat would you like to do?`;
        suggestions = ["Book a ticket", "Train timings", "Crowd levels", "Fare info"];
      }

      return res.json({ reply, nextState: state, suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Voice assistant error" });
    }
  });

  app.get("/api/route/:sourceId/:destId", async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      const destId = parseInt(req.params.destId);
      const source = await storage.getStation(sourceId);
      const dest = await storage.getStation(destId);
      if (!source || !dest) return res.status(404).json({ message: "Station not found" });
      if (source.id === dest.id) return res.status(400).json({ message: "Source and destination must be different" });

      const allStations = await storage.getAllStations();
      const purpleStations = allStations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
      const greenStations = allStations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);

      const majesticPurple = purpleStations.find((s) => s.name.includes("Majestic"));
      const majesticGreen = greenStations.find((s) => s.name.includes("Majestic"));

      const getStationsBetween = (lineStations: typeof allStations, fromOrder: number, toOrder: number) => {
        const minO = Math.min(fromOrder, toOrder);
        const maxO = Math.max(fromOrder, toOrder);
        const segment = lineStations.filter((s) => s.orderIndex >= minO && s.orderIndex <= maxO);
        return fromOrder <= toOrder ? segment : [...segment].reverse();
      };

      const platformForLine = (line: string): number => line === "purple" ? 1 : 2;

      const toRouteStation = (s: typeof allStations[0], isTransfer = false) => {
        return {
          id: s.id,
          name: s.name,
          line: s.line,
          crowdLevel: s.crowdLevel,
          isTransfer,
          platform: platformForLine(s.line),
        };
      };

      const sameLine = source.line === dest.line;
      const routes: any[] = [];

      if (sameLine) {
        const lineStations = source.line === "purple" ? purpleStations : greenStations;
        const segment = getStationsBetween(lineStations, source.orderIndex, dest.orderIndex);
        const stationList = segment.map((s) => toRouteStation(s));
        const travelTime = (segment.length - 1) * 2;
        const lineName = source.line === "purple" ? "Purple" : "Green";

        const avgCrowdScore = (level: string) => level === "high" ? 3 : level === "medium" ? 2 : 1;
        const crowdScore = segment.reduce((sum, s) => sum + avgCrowdScore(s.crowdLevel), 0) / segment.length;
        const highCrowdStations = segment.filter((s) => s.crowdLevel === "high").map((s) => s.name);

        routes.push({
          type: "fastest",
          label: "Fastest Route",
          description: `Direct ${lineName} Line — ${travelTime} min with no transfers`,
          stations: stationList,
          travelTimeMinutes: travelTime,
          transfers: 0,
          transferStation: null,
          estimatedFare: Math.max(10, (segment.length - 1) * 5),
        });

        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
        let crowdDesc: string;
        let crowdTravelTime = travelTime;
        if (highCrowdStations.length > 0) {
          crowdDesc = `Crowded stations on route: ${highCrowdStations.slice(0, 3).join(", ")}. ${isPeak ? "Travel after 10:30 AM or before 5 PM for 40% less crowding." : "Current crowd levels are manageable."}`;
          crowdTravelTime = travelTime + Math.ceil(highCrowdStations.length * 0.5);
        } else if (crowdScore > 1.5) {
          crowdDesc = `Moderate crowd levels. ${isPeak ? "Consider traveling between 11 AM - 3 PM for a quieter journey." : "Good time to travel — below average crowding."}`;
        } else {
          crowdDesc = `Low crowd levels across all stations — excellent time to travel!`;
        }

        routes.push({
          type: "least_crowded",
          label: "Least Crowded Option",
          description: crowdDesc,
          stations: stationList.map((s) => ({ ...s, crowdAlert: s.crowdLevel === "high" })),
          travelTimeMinutes: crowdTravelTime,
          transfers: 0,
          transferStation: null,
          crowdScore: Math.round(crowdScore * 10) / 10,
          bestTimeToTravel: isPeak ? "11:00 AM - 3:00 PM" : "Now",
        });

        routes.push({
          type: "min_transfers",
          label: "Minimum Transfers",
          description: `Direct route on ${lineName} Line — 0 transfers, ${segment.length} stations`,
          stations: stationList,
          travelTimeMinutes: travelTime,
          transfers: 0,
          transferStation: null,
          stationCount: segment.length,
        });
      } else {
        if (!majesticPurple || !majesticGreen) {
          return res.status(500).json({ message: "Interchange station not found" });
        }

        const sourceLine = source.line === "purple" ? purpleStations : greenStations;
        const destLine = dest.line === "purple" ? purpleStations : greenStations;
        const sourceInterchange = source.line === "purple" ? majesticPurple : majesticGreen;
        const destInterchange = dest.line === "purple" ? majesticPurple : majesticGreen;

        const seg1 = getStationsBetween(sourceLine, source.orderIndex, sourceInterchange.orderIndex);
        const seg2 = getStationsBetween(destLine, destInterchange.orderIndex, dest.orderIndex);

        const stationList = [
          ...seg1.map((s) => toRouteStation(s, s.id === sourceInterchange.id)),
          ...seg2.slice(1).map((s) => toRouteStation(s)),
        ];
        if (stationList.length > 0) {
          const transferIdx = seg1.length - 1;
          if (transferIdx >= 0 && transferIdx < stationList.length) {
            stationList[transferIdx] = { ...stationList[transferIdx], isTransfer: true };
          }
        }

        const travelTime = (stationList.length - 1) * 2 + 3;

        const fromPlatform = platformForLine(source.line);
        const toPlatform = platformForLine(dest.line);
        const fromLineName = source.line === "purple" ? "Purple" : "Green";
        const toLineName = dest.line === "purple" ? "Purple" : "Green";

        routes.push({
          type: "fastest",
          label: "Fastest Route",
          description: `Transfer at Kempegowda Majestic — ${fromLineName} Line (Platform ${fromPlatform}) to ${toLineName} Line (Platform ${toPlatform})`,
          stations: stationList,
          travelTimeMinutes: travelTime,
          transfers: 1,
          transferStation: "Kempegowda Majestic",
          transferPlatforms: { from: fromPlatform, to: toPlatform },
        });

        const avgCrowdScore = (level: string) => level === "high" ? 3 : level === "medium" ? 2 : 1;
        const crowdLevels = stationList.map((s) => avgCrowdScore(s.crowdLevel));
        const avgCrowd = crowdLevels.reduce((a, b) => a + b, 0) / crowdLevels.length;
        const crowdDesc = avgCrowd > 2
          ? "High crowd levels expected — consider Sampige Road as alternative transfer point"
          : "Moderate crowd levels — Majestic interchange is manageable at this time";

        routes.push({
          type: "least_crowded",
          label: "Least Crowded",
          description: crowdDesc,
          stations: stationList,
          travelTimeMinutes: travelTime,
          transfers: 1,
          transferStation: "Kempegowda Majestic",
          transferPlatforms: { from: fromPlatform, to: toPlatform },
        });

        routes.push({
          type: "min_transfers",
          label: "Minimum Transfers",
          description: `1 transfer at Kempegowda Majestic — alight Platform ${fromPlatform}, board Platform ${toPlatform}`,
          stations: stationList,
          travelTimeMinutes: travelTime,
          transfers: 1,
          transferStation: "Kempegowda Majestic",
          transferPlatforms: { from: fromPlatform, to: toPlatform },
        });
      }

      res.json({
        source: { id: source.id, name: source.name, line: source.line },
        destination: { id: dest.id, name: dest.name, line: dest.line },
        routes,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to calculate route" });
    }
  });

  app.get("/api/insights", async (_req, res) => {
    const allStations = await storage.getAllStations();
    const demandPredictions = allStations.slice(0, 8).map((s) => {
      const levels = ["low", "medium", "high"];
      const currentIdx = levels.indexOf(s.crowdLevel);
      const predictedIdx = Math.min(2, currentIdx + (Math.random() > 0.5 ? 1 : 0));
      return {
        station: s.name,
        currentLevel: s.crowdLevel,
        predictedLevel: levels[predictedIdx],
        confidence: Math.floor(Math.random() * 20) + 75,
      };
    });

    const recommendations = [
      { type: "timing", title: "Best Travel Window", description: "Travel between 11:00 AM - 2:00 PM for lowest fares and minimal crowding.", impact: "Save 20%" },
      { type: "route", title: "Avoid Majestic Interchange", description: "Kempegowda Majestic is congested. Consider Sampige Road as an alternative transfer.", impact: "15 min faster" },
      { type: "pricing", title: "Weekend Savings", description: "Weekend fares are typically 15% lower. Plan non-urgent travel for Sat/Sun.", impact: "Save 15%" },
    ];

    const anomalies = [
      { type: "crowd_spike", description: "Unusual crowd spike at Majestic station", severity: "high", timestamp: new Date(Date.now() - 3600000).toLocaleString("en-IN") },
      { type: "delay", description: "Minor delay on Purple Line (2 min)", severity: "low", timestamp: new Date(Date.now() - 7200000).toLocaleString("en-IN") },
    ];

    const pricingInsights = {
      avgMultiplier: 1.0 + Math.random() * 0.3,
      peakHours: ["8:00 AM - 10:00 AM", "5:00 PM - 8:00 PM", "9:00 PM - 10:00 PM"],
      revenueLift: 0.12 + Math.random() * 0.08,
    };

    res.json({ demandPredictions, recommendations, anomalies, pricingInsights });
  });

  return httpServer;
}
