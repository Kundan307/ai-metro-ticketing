import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user', 'admin', 'scanner'
  walletBalance: real("wallet_balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  line: text("line").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  orderIndex: integer("order_index").notNull(),
  crowdLevel: text("crowd_level").notNull().default("low"),
  passengerCount: integer("passenger_count").notNull().default(0),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull(),
  sourceStationId: integer("source_station_id").notNull(),
  destStationId: integer("dest_station_id").notNull(),
  sourceName: text("source_name").notNull(),
  destName: text("dest_name").notNull(),
  passengers: integer("passengers").notNull().default(1),
  baseFare: real("base_fare").notNull(),
  dynamicFare: real("dynamic_fare").notNull(),
  totalFare: real("total_fare").notNull(),
  pricingMultiplier: real("pricing_multiplier").notNull().default(1.0),
  demandLevel: text("demand_level").notNull().default("low"),
  paymentMethod: text("payment_method").notNull().default("wallet"),
  status: text("status").notNull().default("active"),
  qrData: text("qr_data"),
  isFraudulent: boolean("is_fraudulent").notNull().default(false),
  fraudReason: text("fraud_reason"),
  sourcePlatform: integer("source_platform"),
  destPlatform: integer("dest_platform"),
  hasTransfer: boolean("has_transfer").notNull().default(false),
  transferStation: text("transfer_station"),
  transferFromPlatform: integer("transfer_from_platform"),
  transferToPlatform: integer("transfer_to_platform"),
  scannedAt: timestamp("scanned_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scanLogs = pgTable("scan_logs", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id").notNull(),
  stationId: integer("station_id").notNull(),
  scanType: text("scan_type").notNull(),
  result: text("result").notNull(),
  fraudDetected: boolean("fraud_detected").notNull().default(false),
  fraudReason: text("fraud_reason"),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, walletBalance: true });
export const insertStationSchema = createInsertSchema(stations).omit({ id: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true });
export const insertScanLogSchema = createInsertSchema(scanLogs).omit({ id: true, scannedAt: true });

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin", "scanner"]).optional(),
  adminSecret: z.string().optional(), // For upgrading to admin during registration
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bookTicketSchema = z.object({
  sourceStationId: z.number(),
  destStationId: z.number(),
  passengers: z.number().min(1).max(6),
  paymentMethod: z.enum(["wallet", "upi"]),
  upiId: z.string().optional(),
});

export const topUpSchema = z.object({
  amount: z.number().min(50, "Minimum top-up is 50").max(10000, "Maximum top-up is 10,000"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const scanTicketSchema = z.object({
  ticketId: z.string(),
  stationId: z.number().optional(),
  scanType: z.enum(["entry", "exit"]).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = z.infer<typeof insertScanLogSchema>;
