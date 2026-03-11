export interface MetroStation {
  id: number;
  name: string;
  line: string;
  lat: number;
  lng: number;
  orderIndex: number;
}

export const METRO_LINES = {
  purple: { name: "Purple Line", color: "#7B2D8E", stations: [] as MetroStation[] },
  green: { name: "Green Line", color: "#00A651", stations: [] as MetroStation[] },
  yellow: { name: "Yellow Line (Upcoming)", color: "#FFD700", stations: [] as MetroStation[] },
  pink: { name: "Pink Line (Upcoming)", color: "#FF69B4", stations: [] as MetroStation[] },
  blue: { name: "Blue Line - Airport (Upcoming)", color: "#0072CE", stations: [] as MetroStation[] },
};

export const PURPLE_LINE_STATIONS: Omit<MetroStation, "id">[] = [
  { name: "Baiyappanahalli", line: "purple", lat: 12.9918, lng: 77.6398, orderIndex: 1 },
  { name: "Swami Vivekananda Road", line: "purple", lat: 12.9855, lng: 77.6366, orderIndex: 2 },
  { name: "Indiranagar", line: "purple", lat: 12.9784, lng: 77.6408, orderIndex: 3 },
  { name: "Halasuru", line: "purple", lat: 12.9816, lng: 77.6198, orderIndex: 4 },
  { name: "Trinity", line: "purple", lat: 12.9727, lng: 77.6199, orderIndex: 5 },
  { name: "Mahatma Gandhi Road", line: "purple", lat: 12.9756, lng: 77.6065, orderIndex: 6 },
  { name: "Cubbon Park", line: "purple", lat: 12.9796, lng: 77.5939, orderIndex: 7 },
  { name: "Vidhana Soudha", line: "purple", lat: 12.9797, lng: 77.5909, orderIndex: 8 },
  { name: "Sir M Visvesvaraya", line: "purple", lat: 12.9771, lng: 77.5745, orderIndex: 9 },
  { name: "Kempegowda Majestic", line: "purple", lat: 12.9767, lng: 77.5713, orderIndex: 10 },
  { name: "City Railway Station", line: "purple", lat: 12.9753, lng: 77.5693, orderIndex: 11 },
  { name: "Magadi Road", line: "purple", lat: 12.9746, lng: 77.5547, orderIndex: 12 },
  { name: "Hosahalli", line: "purple", lat: 12.9589, lng: 77.5391, orderIndex: 13 },
  { name: "Vijayanagar", line: "purple", lat: 12.9611, lng: 77.5328, orderIndex: 14 },
  { name: "Attiguppe", line: "purple", lat: 12.9521, lng: 77.5262, orderIndex: 15 },
  { name: "Deepanjali Nagar", line: "purple", lat: 12.9468, lng: 77.5197, orderIndex: 16 },
  { name: "Mysuru Road", line: "purple", lat: 12.9471, lng: 77.5095, orderIndex: 17 },
  { name: "Nayandahalli", line: "purple", lat: 12.9501, lng: 77.4978, orderIndex: 18 },
  { name: "Rajarajeshwari Nagar", line: "purple", lat: 12.9268, lng: 77.5148, orderIndex: 19 },
  { name: "Jnanabharathi", line: "purple", lat: 12.9341, lng: 77.5028, orderIndex: 20 },
  { name: "Pattanagere", line: "purple", lat: 12.9197, lng: 77.4988, orderIndex: 21 },
  { name: "Kengeri Bus Terminal", line: "purple", lat: 12.9147, lng: 77.4868, orderIndex: 22 },
  { name: "Kengeri", line: "purple", lat: 12.9071, lng: 77.4825, orderIndex: 23 },
];

export const GREEN_LINE_STATIONS: Omit<MetroStation, "id">[] = [
  { name: "Nagasandra", line: "green", lat: 13.0450, lng: 77.5150, orderIndex: 1 },
  { name: "Dasarahalli", line: "green", lat: 13.0359, lng: 77.5145, orderIndex: 2 },
  { name: "Jalahalli", line: "green", lat: 13.0270, lng: 77.5131, orderIndex: 3 },
  { name: "Peenya Industry", line: "green", lat: 13.0215, lng: 77.5185, orderIndex: 4 },
  { name: "Peenya", line: "green", lat: 13.0146, lng: 77.5228, orderIndex: 5 },
  { name: "Goraguntepalya", line: "green", lat: 13.0086, lng: 77.5299, orderIndex: 6 },
  { name: "Yeshwanthpur", line: "green", lat: 13.0057, lng: 77.5399, orderIndex: 7 },
  { name: "Sandal Soap Factory", line: "green", lat: 12.9989, lng: 77.5481, orderIndex: 8 },
  { name: "Mahalakshmi", line: "green", lat: 12.9921, lng: 77.5575, orderIndex: 9 },
  { name: "Rajajinagar", line: "green", lat: 12.9895, lng: 77.5644, orderIndex: 10 },
  { name: "Kuvempu Road", line: "green", lat: 12.9871, lng: 77.5701, orderIndex: 11 },
  { name: "Srirampura", line: "green", lat: 12.9835, lng: 77.5715, orderIndex: 12 },
  { name: "Sampige Road", line: "green", lat: 12.9781, lng: 77.5728, orderIndex: 13 },
  { name: "Kempegowda Majestic (Interchange)", line: "green", lat: 12.9767, lng: 77.5713, orderIndex: 14 },
  { name: "Chickpete", line: "green", lat: 12.9692, lng: 77.5780, orderIndex: 15 },
  { name: "Krishna Rajendra Market", line: "green", lat: 12.9627, lng: 77.5780, orderIndex: 16 },
  { name: "National College", line: "green", lat: 12.9565, lng: 77.5768, orderIndex: 17 },
  { name: "Lalbagh", line: "green", lat: 12.9502, lng: 77.5815, orderIndex: 18 },
  { name: "South End Circle", line: "green", lat: 12.9411, lng: 77.5880, orderIndex: 19 },
  { name: "Jayanagar", line: "green", lat: 12.9303, lng: 77.5828, orderIndex: 20 },
  { name: "Rashtreeya Vidyalaya Road", line: "green", lat: 12.9261, lng: 77.5857, orderIndex: 21 },
  { name: "Banashankari", line: "green", lat: 12.9152, lng: 77.5738, orderIndex: 22 },
  { name: "Jaya Prakash Nagar", line: "green", lat: 12.9071, lng: 77.5723, orderIndex: 23 },
  { name: "Yelachenahalli", line: "green", lat: 12.8969, lng: 77.5698, orderIndex: 24 },
  { name: "Konanakunte Cross", line: "green", lat: 12.8851, lng: 77.5674, orderIndex: 25 },
  { name: "Doddakallasandra", line: "green", lat: 12.8720, lng: 77.5647, orderIndex: 26 },
  { name: "Vajarahalli", line: "green", lat: 12.8598, lng: 77.5612, orderIndex: 27 },
  { name: "Thalaghattapura", line: "green", lat: 12.8488, lng: 77.5583, orderIndex: 28 },
  { name: "Silk Institute", line: "green", lat: 12.8398, lng: 77.5557, orderIndex: 29 },
];

export const LINE_COLORS: Record<string, string> = {
  purple: "#7B2D8E",
  green: "#00A651",
  yellow: "#FFD700",
  pink: "#FF69B4",
  blue: "#0072CE",
};

export function getLineColor(line: string): string {
  return LINE_COLORS[line] || "#666";
}

export function getCrowdColor(level: string): string {
  switch (level) {
    case "low": return "#22c55e";
    case "medium": return "#eab308";
    case "high": return "#ef4444";
    default: return "#666";
  }
}

export function getCrowdBadgeVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "high": return "destructive";
    default: return "secondary";
  }
}

export function calculateBaseFare(sourceOrder: number, destOrder: number, line: string): number {
  const distance = Math.abs(sourceOrder - destOrder);
  const basePricePerStation = 5;
  const minimumFare = 10;
  return Math.max(minimumFare, distance * basePricePerStation);
}
