import { storage } from "./storage";
import { PURPLE_LINE_STATIONS, GREEN_LINE_STATIONS } from "../client/src/lib/metro-data";
import crypto from "crypto";

export async function seedDatabase() {
  const existingCount = await storage.getStationCount();
  
  // Force re-seed to get full station list if counts mismatch (old count was ~50, new is 69)
  if (existingCount > 0 && existingCount !== 69) {
    console.log(`Station count mismatch (${existingCount} vs 69). Re-seeding...`);
    await storage.deleteAllTickets();
    await storage.deleteAllTransactions();
    await storage.deleteAllStations();
  } else if (existingCount === 69) {
    console.log("Database already has all 69 stations, skipping seed.");
    return;
  }

  console.log("Seeding database with Bangalore Metro stations...");

    for (const station of PURPLE_LINE_STATIONS) {
      const crowdLevels = ["low", "medium", "high"];
      const crowdLevel = crowdLevels[Math.floor(Math.random() * 3)];
      const passengerCount =
        crowdLevel === "low"
          ? Math.floor(Math.random() * 150) + 20
          : crowdLevel === "medium"
            ? Math.floor(Math.random() * 300) + 200
            : Math.floor(Math.random() * 400) + 500;

      await storage.createStation({
        name: station.name,
        line: station.line,
        lat: station.lat,
        lng: station.lng,
        orderIndex: station.orderIndex,
        crowdLevel,
        passengerCount,
      });
    }

    for (const station of GREEN_LINE_STATIONS) {
      const crowdLevels = ["low", "medium", "high"];
      const crowdLevel = crowdLevels[Math.floor(Math.random() * 3)];
      const passengerCount =
        crowdLevel === "low"
          ? Math.floor(Math.random() * 150) + 20
          : crowdLevel === "medium"
            ? Math.floor(Math.random() * 300) + 200
            : Math.floor(Math.random() * 400) + 500;

      await storage.createStation({
        name: station.name,
        line: station.line,
        lat: station.lat,
        lng: station.lng,
        orderIndex: station.orderIndex,
        crowdLevel,
        passengerCount,
      });
    }

    console.log("Seeded stations:", PURPLE_LINE_STATIONS.length + GREEN_LINE_STATIONS.length);

  const demoEmail = "demo@bmrcl.com";
  const existingDemo = await storage.getUserByEmail(demoEmail);
  const hashedPassword = crypto.createHash("sha256").update("demo123").digest("hex");
  
  let demoUser = existingDemo;
  if (!existingDemo) {
    console.log("Creating demo user...");
    demoUser = await storage.createUser({
      name: "Demo User",
      email: "demo@bmrcl.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "user",
    });
  }

  const existingScanner = await storage.getUserByEmail("scanner@bmrcl.com");
  if (!existingScanner) {
    await storage.createUser({
      name: "Scanner Device A",
      email: "scanner@bmrcl.com",
      phone: "9876543211",
      password: hashedPassword,
      role: "scanner",
    });
  }

  const existingAdmin = await storage.getUserByEmail("admin@bmrcl.com");
  if (!existingAdmin) {
    await storage.createUser({
      name: "Metro Admin",
      email: "admin@bmrcl.com",
      phone: "9876543212",
      password: hashedPassword,
      role: "admin",
    });
  }

  if (demoUser) {
    const initialBalance = 2875;
    await storage.updateWalletBalance(demoUser.id, initialBalance);
    await storage.createWalletTransaction(demoUser.id, initialBalance, "credit", "Demo credits");

    const userTickets = await storage.getUserTickets(demoUser.id);
    if (userTickets.length === 0) {
      console.log("Creating active tickets for demo user...");
      const allStations = await storage.getAllStations();
      if (allStations.length >= 15) {
        const pairs = [
          { src: 0, dest: 5 },
          { src: 2, dest: 9 },
          { src: 10, dest: 15 },
        ];
        for (const p of pairs) {
          const src = allStations[p.src];
          const dest = allStations[p.dest];
          const baseFare = Math.max(10, Math.abs(src.orderIndex - dest.orderIndex) * 5);
          const multiplier = 1.1;
          const dynamicFare = Math.round(baseFare * multiplier);
          const passengers = Math.floor(Math.random() * 3) + 1;
          await storage.createTicket({
            userId: demoUser.id,
            sourceStationId: src.id,
            destStationId: dest.id,
            sourceName: src.name,
            destName: dest.name,
            passengers,
            baseFare,
            dynamicFare,
            totalFare: dynamicFare * passengers,
            pricingMultiplier: multiplier,
            demandLevel: "medium",
            paymentMethod: "wallet",
            status: "active",
            qrData: null,
            isFraudulent: false,
            fraudReason: null,
            scannedAt: null,
          });
        }
      }
    }
    console.log("Demo user environment ready");
  }

  console.log("Database ready!");
}
