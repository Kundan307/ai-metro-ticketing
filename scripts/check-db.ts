import "dotenv/config";
import { storage } from "../server/storage";

async function check() {
  const count = await storage.getStationCount();
  const stations = await storage.getAllStations();
  console.log(`Current station count: ${count}`);
  console.log(`Purple: ${stations.filter(s => s.line === 'purple').length}`);
  console.log(`Green: ${stations.filter(s => s.line === 'green').length}`);
}

check().catch(console.error);
