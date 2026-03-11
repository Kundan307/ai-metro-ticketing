import { storage } from "./storage";

export function startCrowdSimulator() {
  console.log("Starting crowd simulator (updates every 15 seconds)...");

  setInterval(async () => {
    try {
      const stations = await storage.getAllStations();
      const hour = new Date().getHours();
      const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);

      for (const station of stations) {
        const isInterchange = station.name.includes("Majestic") || station.name.includes("Interchange");
        const baseCount = isInterchange ? 400 : 150;
        const peakMultiplier = isPeak ? 2.5 : 1;
        const variation = (Math.random() - 0.5) * 100;
        const newCount = Math.max(10, Math.floor((baseCount + variation) * peakMultiplier));

        let crowdLevel: string;
        if (newCount < 200) crowdLevel = "low";
        else if (newCount < 500) crowdLevel = "medium";
        else crowdLevel = "high";

        await storage.updateStationCrowd(station.id, crowdLevel, newCount);
      }
    } catch (error) {
      console.error("Crowd simulator error:", error);
    }
  }, 15000);
}
