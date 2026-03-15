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

export const PURPLE_LINE_STATIONS = [
  { name: "Challaghatta", line: "purple", lat: 12.8973, lng: 77.4612, orderIndex: 0 },
  { name: "Kengeri", line: "purple", lat: 12.9079, lng: 77.4766, orderIndex: 1 },
  { name: "Kengeri Bus Terminal", line: "purple", lat: 12.9147, lng: 77.4878, orderIndex: 2 },
  { name: "Pattanagere", line: "purple", lat: 12.9242, lng: 77.4983, orderIndex: 3 },
  { name: "Jnanabharathi", line: "purple", lat: 12.9354, lng: 77.5124, orderIndex: 4 },
  { name: "Rajarajeshwari Nagar", line: "purple", lat: 12.9366, lng: 77.5197, orderIndex: 5 },
  { name: "Nayandahalli", line: "purple", lat: 12.9417, lng: 77.5251, orderIndex: 6 },
  { name: "Mysuru Road", line: "purple", lat: 12.9467, lng: 77.5301, orderIndex: 7 },
  { name: "Deepanjali Nagar", line: "purple", lat: 12.9520, lng: 77.5370, orderIndex: 8 },
  { name: "Attiguppe", line: "purple", lat: 12.9619, lng: 77.5336, orderIndex: 9 },
  { name: "Vijayanagar", line: "purple", lat: 12.9710, lng: 77.5374, orderIndex: 10 },
  { name: "Hosahalli", line: "purple", lat: 12.9742, lng: 77.5456, orderIndex: 11 },
  { name: "Magadi Road", line: "purple", lat: 12.9756, lng: 77.5554, orderIndex: 12 },
  { name: "KSR Railway Station", line: "purple", lat: 12.9759, lng: 77.5654, orderIndex: 13 },
  { name: "Majestic", line: "purple", lat: 12.9757, lng: 77.5728, orderIndex: 14 },
  { name: "Sir M. Visvesvaraya", line: "purple", lat: 12.9745, lng: 77.5842, orderIndex: 15 },
  { name: "Vidhana Soudha", line: "purple", lat: 12.9790, lng: 77.5918, orderIndex: 16 },
  { name: "Cubbon Park", line: "purple", lat: 12.9810, lng: 77.5976, orderIndex: 17 },
  { name: "MG Road", line: "purple", lat: 12.9754, lng: 77.6073, orderIndex: 18 },
  { name: "Trinity", line: "purple", lat: 12.9730, lng: 77.6170, orderIndex: 19 },
  { name: "Halasuru", line: "purple", lat: 12.9765, lng: 77.6267, orderIndex: 20 },
  { name: "Indiranagar", line: "purple", lat: 12.9783, lng: 77.6387, orderIndex: 21 },
  { name: "Swami Vivekananda Road", line: "purple", lat: 12.9860, lng: 77.6449, orderIndex: 22 },
  { name: "Baiyappanahalli", line: "purple", lat: 12.9907, lng: 77.6524, orderIndex: 23 },
  { name: "Benniganahalli", line: "purple", lat: 12.9965, lng: 77.6685, orderIndex: 24 },
  { name: "KR Puram", line: "purple", lat: 13.0000, lng: 77.6778, orderIndex: 25 },
  { name: "Singayyanapalya", line: "purple", lat: 12.9965, lng: 77.6927, orderIndex: 26 },
  { name: "Garudacharpalya", line: "purple", lat: 12.9935, lng: 77.7037, orderIndex: 27 },
  { name: "Hoodi", line: "purple", lat: 12.9888, lng: 77.7113, orderIndex: 28 },
  { name: "Seetharampalya", line: "purple", lat: 12.9809, lng: 77.7088, orderIndex: 29 },
  { name: "Kundalahalli", line: "purple", lat: 12.9776, lng: 77.7156, orderIndex: 30 },
  { name: "Nallur Halli", line: "purple", lat: 12.9766, lng: 77.7249, orderIndex: 31 },
  { name: "Sri Sathya Sai Hospital", line: "purple", lat: 12.9812, lng: 77.7275, orderIndex: 32 },
  { name: "Pattandur Agrahara", line: "purple", lat: 12.9876, lng: 77.7378, orderIndex: 33 },
  { name: "Kadugodi Tree Park", line: "purple", lat: 12.9873, lng: 77.7538, orderIndex: 34 },
  { name: "Whitefield", line: "purple", lat: 12.9957, lng: 77.7579, orderIndex: 35 },
];

export const GREEN_LINE_STATIONS = [
  { name: "Madavara", line: "green", lat: 13.0574, lng: 77.4728, orderIndex: 0 },
  { name: "Chikkabidarakallu", line: "green", lat: 13.0524, lng: 77.4879, orderIndex: 1 },
  { name: "Manjunathanagar", line: "green", lat: 13.0501, lng: 77.4944, orderIndex: 2 },
  { name: "Nagasandra", line: "green", lat: 13.0479, lng: 77.5001, orderIndex: 3 },
  { name: "Dasarahalli", line: "green", lat: 13.0432, lng: 77.5126, orderIndex: 4 },
  { name: "Jalahalli", line: "green", lat: 13.0394, lng: 77.5198, orderIndex: 5 },
  { name: "Peenya Industry", line: "green", lat: 13.0363, lng: 77.5255, orderIndex: 6 },
  { name: "Peenya", line: "green", lat: 13.0330, lng: 77.5332, orderIndex: 7 },
  { name: "Goraguntepalya", line: "green", lat: 13.0286, lng: 77.5404, orderIndex: 8 },
  { name: "Yeshwanthpur", line: "green", lat: 13.0233, lng: 77.5497, orderIndex: 9 },
  { name: "Sandal Soap Factory", line: "green", lat: 13.0147, lng: 77.5540, orderIndex: 10 },
  { name: "Mahalakshmi", line: "green", lat: 13.0081, lng: 77.5488, orderIndex: 11 },
  { name: "Rajajinagar", line: "green", lat: 13.0005, lng: 77.5496, orderIndex: 12 },
  { name: "Kuvempu Road", line: "green", lat: 12.9985, lng: 77.5569, orderIndex: 13 },
  { name: "Srirampura", line: "green", lat: 12.9965, lng: 77.5633, orderIndex: 14 },
  { name: "Mantri Square Sampige Road", line: "green", lat: 12.9904, lng: 77.5707, orderIndex: 15 },
  { name: "Majestic", line: "green", lat: 12.9751, lng: 77.5730, orderIndex: 16 },
  { name: "Chickpete", line: "green", lat: 12.9669, lng: 77.5746, orderIndex: 17 },
  { name: "KR Market", line: "green", lat: 12.9609, lng: 77.5746, orderIndex: 18 },
  { name: "National College", line: "green", lat: 12.9505, lng: 77.5737, orderIndex: 19 },
  { name: "Lalbagh", line: "green", lat: 12.9465, lng: 77.5800, orderIndex: 20 },
  { name: "South End Circle", line: "green", lat: 12.9383, lng: 77.5800, orderIndex: 21 },
  { name: "Jayanagar", line: "green", lat: 12.9295, lng: 77.5801, orderIndex: 22 },
  { name: "RV Road", line: "green", lat: 12.9216, lng: 77.5802, orderIndex: 23 },
  { name: "Banashankari", line: "green", lat: 12.9152, lng: 77.5736, orderIndex: 24 },
  { name: "JP Nagar", line: "green", lat: 12.9075, lng: 77.5731, orderIndex: 25 },
  { name: "Yelachenahalli", line: "green", lat: 12.8961, lng: 77.5701, orderIndex: 26 },
  { name: "Konanakunte Cross", line: "green", lat: 12.8890, lng: 77.5627, orderIndex: 27 },
  { name: "Doddakallasandra", line: "green", lat: 12.8846, lng: 77.5528, orderIndex: 28 },
  { name: "Vajarahalli", line: "green", lat: 12.8775, lng: 77.5448, orderIndex: 29 },
  { name: "Thalaghattapura", line: "green", lat: 12.8714, lng: 77.5384, orderIndex: 30 },
  { name: "Silk Institute", line: "green", lat: 12.8617, lng: 77.5300, orderIndex: 31 },
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
