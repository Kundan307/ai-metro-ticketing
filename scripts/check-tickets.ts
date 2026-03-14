import "dotenv/config";
import { storage } from "../server/storage";

async function checkTickets() {
  const user = await storage.getUserByEmail("demo@bmrcl.com");
  if (!user) {
    console.log("Demo user not found");
    return;
  }
  const tickets = await storage.getUserTickets(user.id);
  console.log(`User ${user.email} (ID: ${user.id}) has ${tickets.length} tickets.`);
  tickets.forEach(t => {
    console.log(`Ticket ID: ${t.id}, Status: ${t.status}, From: ${t.sourceName} (ID: ${t.sourceStationId}), To: ${t.destName} (ID: ${t.destStationId})`);
  });

  const stations = await storage.getAllStations();
  console.log(`Total stations in DB: ${stations.length}`);
}

checkTickets().catch(console.error);
