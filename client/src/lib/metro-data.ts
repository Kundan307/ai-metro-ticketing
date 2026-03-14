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
  { name: "Whitefield (Kadugodi)", line: "purple", lat: 12.9951, lng: 77.7578, orderIndex: 1 },
  { name: "Hopefarm Channasandra", line: "purple", lat: 12.9879, lng: 77.7541, orderIndex: 2 },
  { name: "Kadugodi Tree Park", line: "purple", lat: 12.9857, lng: 77.7469, orderIndex: 3 },
  { name: "Pattandur Agrahara", line: "purple", lat: 12.9876, lng: 77.7382, orderIndex: 4 },
  { name: "Sri Sathya Sai Hospital", line: "purple", lat: 12.9810, lng: 77.7276, orderIndex: 5 },
  { name: "Nallurhalli", line: "purple", lat: 12.9765, lng: 77.7248, orderIndex: 6 },
  { name: "Kundalahalli", line: "purple", lat: 12.9775, lng: 77.7158, orderIndex: 7 },
  { name: "Seetharampalya", line: "purple", lat: 12.9820, lng: 77.7120, orderIndex: 8 },
  { name: "Hoodi", line: "purple", lat: 12.9887, lng: 77.7113, orderIndex: 9 },
  { name: "Garudacharpalya", line: "purple", lat: 12.9936, lng: 77.7038, orderIndex: 10 },
  { name: "Singayyanapalya", line: "purple", lat: 12.9968, lng: 77.6922, orderIndex: 11 },
  { name: "Krishnarajapura", line: "purple", lat: 12.9999, lng: 77.6779, orderIndex: 12 },
  { name: "Benniganahalli", line: "purple", lat: 12.9930, lng: 77.6610, orderIndex: 13 },
  { name: "Baiyappanahalli", line: "purple", lat: 12.9918, lng: 77.6398, orderIndex: 14 },
  { name: "Swami Vivekananda Road", line: "purple", lat: 12.9855, lng: 77.6366, orderIndex: 15 },
  { name: "Indiranagar", line: "purple", lat: 12.9784, lng: 77.6408, orderIndex: 16 },
  { name: "Halasuru", line: "purple", lat: 12.9816, lng: 77.6198, orderIndex: 17 },
  { name: "Trinity", line: "purple", lat: 12.9727, lng: 77.6199, orderIndex: 18 },
  { name: "Mahatma Gandhi Road", line: "purple", lat: 12.9756, lng: 77.6065, orderIndex: 19 },
  { name: "Cubbon Park", line: "purple", lat: 12.9796, lng: 77.5939, orderIndex: 20 },
  { name: "Vidhana Soudha", line: "purple", lat: 12.9797, lng: 77.5909, orderIndex: 21 },
  { name: "Sir M Visvesvaraya", line: "purple", lat: 12.9771, lng: 77.5745, orderIndex: 22 },
  { name: "Kempegowda Majestic", line: "purple", lat: 12.9767, lng: 77.5713, orderIndex: 23 },
  { name: "City Railway Station", line: "purple", lat: 12.9753, lng: 77.5693, orderIndex: 24 },
  { name: "Magadi Road", line: "purple", lat: 12.9746, lng: 77.5547, orderIndex: 25 },
  { name: "Hosahalli", line: "purple", lat: 12.9589, lng: 77.5391, orderIndex: 26 },
  { name: "Vijayanagar", line: "purple", lat: 12.9611, lng: 77.5328, orderIndex: 27 },
  { name: "Attiguppe", line: "purple", lat: 12.9521, lng: 77.5262, orderIndex: 28 },
  { name: "Deepanjali Nagar", line: "purple", lat: 12.9468, lng: 77.5197, orderIndex: 29 },
  { name: "Mysuru Road", line: "purple", lat: 12.9471, lng: 77.5095, orderIndex: 30 },
  { name: "Nayandahalli", line: "purple", lat: 12.9501, lng: 77.4978, orderIndex: 31 },
  { name: "Rajarajeshwari Nagar", line: "purple", lat: 12.9268, lng: 77.5148, orderIndex: 32 },
  { name: "Jnanabharathi", line: "purple", lat: 12.9341, lng: 77.5028, orderIndex: 33 },
  { name: "Pattanagere", line: "purple", lat: 12.9197, lng: 77.4988, orderIndex: 34 },
  { name: "Kengeri Bus Terminal", line: "purple", lat: 12.9147, lng: 77.4868, orderIndex: 35 },
  { name: "Kengeri", line: "purple", lat: 12.9071, lng: 77.4825, orderIndex: 36 },
  { name: "Challaghatta", line: "purple", lat: 12.8974, lng: 77.4612, orderIndex: 37 },
];

export const GREEN_LINE_STATIONS: Omit<MetroStation, "id">[] = [
  { name: "Madavara", line: "green", lat: 13.0550, lng: 77.4950, orderIndex: 1 },
  { name: "Chikkabidarakallu", line: "green", lat: 13.0500, lng: 77.5050, orderIndex: 2 },
  { name: "Manjunathanagar", line: "green", lat: 13.0475, lng: 77.5100, orderIndex: 3 },
  { name: "Nagasandra", line: "green", lat: 13.0450, lng: 77.5150, orderIndex: 4 },
  { name: "Dasarahalli", line: "green", lat: 13.0359, lng: 77.5145, orderIndex: 5 },
  { name: "Jalahalli", line: "green", lat: 13.0270, lng: 77.5131, orderIndex: 6 },
  { name: "Peenya Industry", line: "green", lat: 13.0215, lng: 77.5185, orderIndex: 7 },
  { name: "Peenya", line: "green", lat: 13.0146, lng: 77.5228, orderIndex: 8 },
  { name: "Goraguntepalya", line: "green", lat: 13.0086, lng: 77.5299, orderIndex: 9 },
  { name: "Yeshwanthpur", line: "green", lat: 13.0057, lng: 77.5399, orderIndex: 10 },
  { name: "Sandal Soap Factory", line: "green", lat: 12.9989, lng: 77.5481, orderIndex: 11 },
  { name: "Mahalakshmi", line: "green", lat: 12.9921, lng: 77.5575, orderIndex: 12 },
  { name: "Rajajinagar", line: "green", lat: 12.9895, lng: 77.5644, orderIndex: 13 },
  { name: "Kuvempu Road", line: "green", lat: 12.9871, lng: 77.5701, orderIndex: 14 },
  { name: "Srirampura", line: "green", lat: 12.9835, lng: 77.5715, orderIndex: 15 },
  { name: "Sampige Road", line: "green", lat: 12.9781, lng: 77.5728, orderIndex: 16 },
  { name: "Kempegowda Majestic", line: "green", lat: 12.9767, lng: 77.5713, orderIndex: 17 },
  { name: "Chickpete", line: "green", lat: 12.9692, lng: 77.5780, orderIndex: 18 },
  { name: "Krishna Rajendra Market", line: "green", lat: 12.9627, lng: 77.5780, orderIndex: 19 },
  { name: "National College", line: "green", lat: 12.9565, lng: 77.5768, orderIndex: 20 },
  { name: "Lalbagh", line: "green", lat: 12.9502, lng: 77.5815, orderIndex: 21 },
  { name: "South End Circle", line: "green", lat: 12.9411, lng: 77.5880, orderIndex: 22 },
  { name: "Jayanagar", line: "green", lat: 12.9303, lng: 77.5828, orderIndex: 23 },
  { name: "Rashtreeya Vidyalaya Road", line: "green", lat: 12.9261, lng: 77.5857, orderIndex: 24 },
  { name: "Banashankari", line: "green", lat: 12.9152, lng: 77.5738, orderIndex: 25 },
  { name: "Jaya Prakash Nagar", line: "green", lat: 12.9071, lng: 77.5723, orderIndex: 26 },
  { name: "Yelachenahalli", line: "green", lat: 12.8969, lng: 77.5698, orderIndex: 27 },
  { name: "Konanakunte Cross", line: "green", lat: 12.8851, lng: 77.5674, orderIndex: 28 },
  { name: "Doddakallasandra", line: "green", lat: 12.8720, lng: 77.5647, orderIndex: 29 },
  { name: "Vajarahalli", line: "green", lat: 12.8598, lng: 77.5612, orderIndex: 30 },
  { name: "Thalaghattapura", line: "green", lat: 12.8488, lng: 77.5583, orderIndex: 31 },
  { name: "Silk Institute", line: "green", lat: 12.8398, lng: 77.5557, orderIndex: 32 },
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
