import { eq, desc, sql, count, and, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  users,
  walletTransactions,
  stations,
  tickets,
  scanLogs,
  type User,
  type InsertUser,
  type WalletTransaction,
  type Station,
  type InsertStation,
  type Ticket,
  type InsertTicket,
  type ScanLog,
  type InsertScanLog,
} from "@shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserProfile(userId: number, updates: { name?: string; phone?: string; password?: string }): Promise<User>;
  updateWalletBalance(userId: number, newBalance: number): Promise<void>;
  createWalletTransaction(userId: number, amount: number, type: string, description: string): Promise<WalletTransaction>;
  getWalletTransactions(userId: number): Promise<WalletTransaction[]>;

  getAllUsers(): Promise<Omit<User, "password">[]>;
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;
  updateStationCrowd(id: number, crowdLevel: string, passengerCount: number): Promise<void>;
  getStationCount(): Promise<number>;

  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: string): Promise<Ticket | undefined>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<void>;
  cancelTicketIfActive(id: string): Promise<boolean>;
  getRecentTickets(limit: number): Promise<Ticket[]>;
  getUserTickets(userId: number): Promise<Ticket[]>;
  getTicketStats(): Promise<{ totalTickets: number; totalRevenue: number; fraudCount: number; avgFare: number }>;

  createScanLog(log: InsertScanLog): Promise<ScanLog>;
  getRecentScans(limit: number): Promise<ScanLog[]>;
  getScanCountForTicket(ticketId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserProfile(userId: number, updates: { name?: string; phone?: string; password?: string }): Promise<User> {
    const setValues: Record<string, any> = {};
    if (updates.name) setValues.name = updates.name;
    if (updates.phone) setValues.phone = updates.phone;
    if (updates.password) setValues.password = updates.password;
    const [updated] = await db.update(users).set(setValues).where(eq(users.id, userId)).returning();
    return updated;
  }

  async updateWalletBalance(userId: number, newBalance: number): Promise<void> {
    await db.update(users).set({ walletBalance: newBalance }).where(eq(users.id, userId));
  }

  async createWalletTransaction(userId: number, amount: number, type: string, description: string): Promise<WalletTransaction> {
    const [created] = await db.insert(walletTransactions).values({
      userId,
      amount,
      type,
      description,
    }).returning();
    return created;
  }

  async getWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      walletBalance: users.walletBalance,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }

  async getAllStations(): Promise<Station[]> {
    return db.select().from(stations).orderBy(stations.line, stations.orderIndex);
  }

  async getStation(id: number): Promise<Station | undefined> {
    const [station] = await db.select().from(stations).where(eq(stations.id, id));
    return station;
  }

  async createStation(station: InsertStation): Promise<Station> {
    const [created] = await db.insert(stations).values(station).returning();
    return created;
  }

  async updateStationCrowd(id: number, crowdLevel: string, passengerCount: number): Promise<void> {
    await db.update(stations).set({ crowdLevel, passengerCount }).where(eq(stations.id, id));
  }

  async getStationCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(stations);
    return result.count;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(ticket).returning();
    return created;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    if (id.length < 36) {
      const results = await db.select().from(tickets).where(ilike(tickets.id, `${id}%`)).limit(1);
      return results[0];
    }
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    await db.update(tickets).set(updates).where(eq(tickets.id, id));
  }

  async cancelTicketIfActive(id: string): Promise<boolean> {
    const result = await db
      .update(tickets)
      .set({ status: "cancelled" })
      .where(and(eq(tickets.id, id), eq(tickets.status, "active")))
      .returning();
    return result.length > 0;
  }

  async getRecentTickets(limit: number): Promise<Ticket[]> {
    return db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(limit);
  }

  async getUserTickets(userId: number): Promise<Ticket[]> {
    return db.select().from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketStats() {
    const allTickets = await db.select().from(tickets);
    const totalTickets = allTickets.length;
    const totalRevenue = allTickets.reduce((sum, t) => sum + t.totalFare, 0);
    const fraudCount = allTickets.filter((t) => t.isFraudulent).length;
    const avgFare = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    return { totalTickets, totalRevenue, fraudCount, avgFare };
  }

  async createScanLog(log: InsertScanLog): Promise<ScanLog> {
    const [created] = await db.insert(scanLogs).values(log).returning();
    return created;
  }

  async getRecentScans(limit: number): Promise<ScanLog[]> {
    return db.select().from(scanLogs).orderBy(desc(scanLogs.scannedAt)).limit(limit);
  }

  async getScanCountForTicket(ticketId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(scanLogs)
      .where(eq(scanLogs.ticketId, ticketId));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
