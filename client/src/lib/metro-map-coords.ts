// Approximate relative coordinates (percentages) for the Namma Metro Bangalore Map SVG
// These map the stations to their precise locations on the official 2021 schematic map

export interface Point {
  x: number;
  y: number;
}

export const StationCoordinates: Record<string, Point> = {
  // PURPLE LINE (East-West)
  "Challaghatta": { x: 5, y: 55 },
  "Kengeri": { x: 8, y: 56 },
  "Rajarajeshwari Nagar": { x: 14, y: 57 },
  "Nayandahalli": { x: 17, y: 57 },
  "Mysuru Road": { x: 20, y: 57 },
  "Deepanjali Nagar": { x: 23, y: 57 },
  "Attiguppe": { x: 26, y: 57 },
  "Vijayanagar": { x: 29, y: 57 },
  "Hosahalli": { x: 32, y: 57 },
  "Magadi Road": { x: 35, y: 57 },
  "Krantivira Sangolli Rayanna Railway Station": { x: 40, y: 55 },
  "Nadaprabhu Kempegowda Station, Majestic": { x: 45, y: 51 }, // Interchange
  "Sir M. Visveshwaraya Station, Central College": { x: 49, y: 51 },
  "Dr. B.R. Ambedkar Station, Vidhana Soudha": { x: 53, y: 51 },
  "Cubbon Park": { x: 57, y: 51 },
  "Mahatma Gandhi Road": { x: 61, y: 51 },
  "Trinity": { x: 65, y: 51 },
  "Halasuru": { x: 69, y: 51 },
  "Indiranagar": { x: 73, y: 51 },
  "Swami Vivekananda Road": { x: 76, y: 50 },
  "Baiyappanahalli": { x: 79, y: 49 },
  "Benniganahalli": { x: 82, y: 48 },
  "K.R. Pura": { x: 85, y: 47 },
  "Garudacharapalya": { x: 88, y: 46 },
  "Hoodi Junction": { x: 91, y: 45 },
  "Seetharampalya": { x: 94, y: 44 },
  "Kundalahalli": { x: 97, y: 43 },
  "Nallurhalli": { x: 97, y: 40 },
  "Sri Sathya Sai Hospital": { x: 97, y: 37 },
  "Pattandur Agrahara": { x: 97, y: 34 },
  "Kadugodi Tree Park": { x: 97, y: 31 },
  "Hopefarm Channasandra": { x: 97, y: 28 },
  "Whitefield": { x: 97, y: 25 },

  // GREEN LINE (North-South)
  "Madavara": { x: 15, y: 15 },
  "Chikkabidarakallu": { x: 17, y: 17 },
  "Manjunathanagar": { x: 19, y: 19 },
  "Nagasandra": { x: 22, y: 22 },
  "Dasarahalli": { x: 25, y: 25 },
  "Jalahalli": { x: 28, y: 28 },
  "Peenya Industry": { x: 31, y: 31 },
  "Peenya": { x: 34, y: 34 },
  "Goraguntepalya": { x: 37, y: 37 },
  "Yeshwanthpur": { x: 40, y: 39 },
  "Sandal Soap Factory": { x: 43, y: 41 },
  "Mahalakshmi": { x: 45, y: 43 },
  "Rajajinagar": { x: 45, y: 45 },
  "Kuvempu Road": { x: 45, y: 47 },
  "Srirampura": { x: 45, y: 49 },
  "Mantri Square Sampige Road": { x: 45, y: 50 },
  // Majestic Intersect { x: 45, y: 51 }
  "Chickpete": { x: 45, y: 54 },
  "Krishna Rajendra Market": { x: 45, y: 57 },
  "National College": { x: 45, y: 60 },
  "Lalbagh": { x: 45, y: 63 },
  "South End Circle": { x: 45, y: 66 },
  "Jayanagar": { x: 45, y: 69 },
  "Rashtriya Vidyalaya Road": { x: 45, y: 72 },
  "Banashankari": { x: 45, y: 75 },
  "Jaya Prakash Nagar": { x: 45, y: 78 },
  "Yelachenahalli": { x: 45, y: 81 },
  "Konanakunte Cross": { x: 45, y: 84 },
  "Doddakallasandra": { x: 45, y: 87 },
  "Vajarahalli": { x: 45, y: 90 },
  "Talaghattapura": { x: 45, y: 93 },
  "Silk Institute": { x: 45, y: 96 }
};
