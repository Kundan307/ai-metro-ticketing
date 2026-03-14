import "dotenv/config";
import { seedDatabase } from "../server/seed";

async function run() {
  console.log("Starting manual seed (forcing clear)...");
  const { storage } = await import("../server/storage");
  await storage.deleteAllTickets();
  await storage.deleteAllTransactions();
  await storage.deleteAllStations();
  await seedDatabase();
  console.log("Manual seed complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Manual seed failed:", err);
  process.exit(1);
});
