import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  NavigationIcon,
  ArrowUpDownIcon,
  ClockIcon,
  TrainFrontIcon,
  CircleDotIcon,
  MapPinIcon,
  ZapIcon,
  WalletIcon,
  FootprintsIcon,
  BusIcon,
  CarIcon,
  ArrowRightIcon,
  SparklesIcon,
  IndianRupeeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LocateFixedIcon,
} from "lucide-react";

interface RouteLeg {
  mode: "walk" | "bus" | "auto" | "cab" | "metro";
  from: string;
  to: string;
  duration: number;
  fare: number;
  instruction: string;
  distanceKm?: number;
  stations?: { id: number; name: string; line: string; crowdLevel: string }[];
  transfer?: boolean;
  transferStation?: string | null;
}

interface RouteOption {
  type: string;
  label: string;
  description: string;
  totalTime: number;
  totalFare: number;
  legs: RouteLeg[];
}

interface RouteResponse {
  from: { name: string; lat: number; lng: number };
  to: { name: string; lat: number; lng: number };
  nearestSourceStation: { name: string; line: string; distanceKm: number };
  nearestDestStation: { name: string; line: string; distanceKm: number };
  routes: RouteOption[];
}

interface LocationSuggestion {
  name: string;
  area: string;
  category?: string;
  source?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  area: "📍",
  hotel: "🏨",
  college: "🎓",
  school: "🏫",
  restaurant: "🍽️",
  tourist: "🏛️",
  hospital: "🏥",
  mall: "🛒",
  tech_park: "💼",
  landmark: "🏟️",
  bus_stand: "🚌",
  place: "📌",
};

const MODE_ICONS: Record<string, typeof ZapIcon> = {
  walk: FootprintsIcon,
  bus: BusIcon,
  auto: CarIcon,
  cab: CarIcon,
  metro: TrainFrontIcon,
};

const MODE_COLORS: Record<string, string> = {
  walk: "#22c55e",
  bus: "#f59e0b",
  auto: "#8b5cf6",
  cab: "#3b82f6",
  metro: "#7B2D8E",
};

const MODE_BG: Record<string, string> = {
  walk: "bg-green-500/10",
  bus: "bg-amber-500/10",
  auto: "bg-violet-500/10",
  cab: "bg-blue-500/10",
  metro: "bg-purple-500/10",
};

const MODE_LABELS: Record<string, string> = {
  walk: "Walk",
  bus: "BMTC Bus",
  auto: "Auto",
  cab: "Cab",
  metro: "Metro",
};

const ROUTE_ACCENT: Record<string, string> = {
  fastest: "border-blue-500/30 bg-blue-500/5",
  cheapest: "border-green-500/30 bg-green-500/5",
  balanced: "border-violet-500/30 bg-violet-500/5",
};

const ROUTE_BADGE: Record<string, string> = {
  fastest: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  cheapest: "bg-green-500/15 text-green-400 border-green-500/30",
  balanced: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export default function RoutePlanner() {
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [showFromSugg, setShowFromSugg] = useState(false);
  const [showToSugg, setShowToSugg] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(0);

  const [fromGeocodeQuery, setFromGeocodeQuery] = useState("");
  const [toGeocodeQuery, setToGeocodeQuery] = useState("");

  const { data: locations } = useQuery<LocationSuggestion[]>({
    queryKey: ["/api/locations"],
  });

  // Geocode search for "from" input (debounced via query key)
  const { data: fromGeoResults } = useQuery<{ results: LocationSuggestion[] }>({
    queryKey: ["/api/geocode", fromGeocodeQuery],
    queryFn: async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(fromGeocodeQuery)}`, { credentials: "include" });
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: !!fromGeocodeQuery && fromGeocodeQuery.length >= 3,
  });

  // Geocode search for "to" input
  const { data: toGeoResults } = useQuery<{ results: LocationSuggestion[] }>({
    queryKey: ["/api/geocode", toGeocodeQuery],
    queryFn: async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(toGeocodeQuery)}`, { credentials: "include" });
      if (!res.ok) return { results: [] };
      return res.json();
    },
    enabled: !!toGeocodeQuery && toGeocodeQuery.length >= 3,
  });

  const { data: routeData, isLoading: routeLoading } = useQuery<RouteResponse>({
    queryKey: ["/api/route", fromQuery, toQuery],
    queryFn: async () => {
      const res = await fetch(`/api/route?from=${encodeURIComponent(fromQuery)}&to=${encodeURIComponent(toQuery)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch route");
      return res.json();
    },
    enabled: !!fromQuery && !!toQuery && fromQuery !== toQuery,
  });

  const filteredFrom = useMemo(() => {
    if (!fromInput) return [];
    const q = fromInput.toLowerCase();
    // Local results first
    const local = (locations || []).filter(l => l.name.toLowerCase().includes(q)).slice(0, 5);
    // Append geocode results if available
    const geo = fromGeoResults?.results?.filter(r => !local.some(l => l.name === r.name)) || [];
    return [...local, ...geo].slice(0, 8);
  }, [locations, fromInput, fromGeoResults]);

  const filteredTo = useMemo(() => {
    if (!toInput) return [];
    const q = toInput.toLowerCase();
    const local = (locations || []).filter(l => l.name.toLowerCase().includes(q) && l.name !== fromQuery).slice(0, 5);
    const geo = toGeoResults?.results?.filter(r => !local.some(l => l.name === r.name)) || [];
    return [...local, ...geo].slice(0, 8);
  }, [locations, toInput, fromQuery, toGeoResults]);

  const handleSearch = () => {
    if (fromInput && toInput && fromInput !== toInput) {
      setFromQuery(fromInput);
      setToQuery(toInput);
      setExpandedRoute(0);
    }
  };

  const swapLocations = () => {
    const tmp = fromInput;
    setFromInput(toInput);
    setToInput(tmp);
    if (fromQuery && toQuery) {
      setFromQuery(toQuery);
      setToQuery(fromQuery);
    }
  };

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <NavigationIcon className="w-5 h-5 text-primary" />
            Multimodal Route Planner
          </h1>
          <p className="text-xs text-muted-foreground">
            Find the best way to reach your destination using Metro + Bus, Auto & Cab
          </p>
        </div>

        {/* Input Card */}
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            {/* From Input */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CircleDotIcon className="w-3 h-3 text-green-500" />
                  Where are you?
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] px-2 text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                  onClick={() => {
                    if ("geolocation" in navigator) {
                      setFromInput("📍 Locating...");
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords;
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
                              headers: { "Accept-Language": "en" }
                            });
                            if (res.ok) {
                              const data = await res.json();
                              // Try to find the most meaningful local name
                              const placeName = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.town || "Current Location";
                              setFromInput(`📍 ${placeName}`);
                            } else {
                              setFromInput("📍 Current Location");
                            }
                          } catch (e) {
                            setFromInput("📍 Current Location");
                          }
                          setFromGeocodeQuery(`${latitude},${longitude}`);
                          setShowFromSugg(false);
                        },
                        (error) => {
                          console.error("Error getting location: ", error);
                          setFromInput("");
                        }
                      );
                    }
                  }}
                >
                  <LocateFixedIcon className="w-3 h-3 mr-1" />
                  Locate Me
                </Button>
              </div>
              <Input
                placeholder="e.g., Koramangala, HSR Layout, Whitefield..."
                value={fromInput}
                onChange={(e) => { setFromInput(e.target.value); setShowFromSugg(true); setFromGeocodeQuery(e.target.value); }}
                onFocus={() => setShowFromSugg(true)}
                onBlur={() => setTimeout(() => setShowFromSugg(false), 200)}
                className="h-11"
              />
              {showFromSugg && filteredFrom.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredFrom.map((loc) => (
                    <button
                      key={loc.name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
                      onMouseDown={() => { setFromInput(loc.name); setShowFromSugg(false); }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 text-center text-sm">{CATEGORY_EMOJI[loc.category || "area"] || "📍"}</span>
                        {loc.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{loc.source === "nominatim" ? "🌐 " : ""}{loc.area}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={swapLocations}
                disabled={!fromInput || !toInput}
              >
                <ArrowUpDownIcon className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* To Input */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPinIcon className="w-3 h-3 text-red-500" />
                Where to?
              </Label>
              <Input
                placeholder="e.g., Electronic City, MG Road, Majestic..."
                value={toInput}
                onChange={(e) => { setToInput(e.target.value); setShowToSugg(true); setToGeocodeQuery(e.target.value); }}
                onFocus={() => setShowToSugg(true)}
                onBlur={() => setTimeout(() => setShowToSugg(false), 200)}
                className="h-11"
              />
              {showToSugg && filteredTo.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredTo.map((loc) => (
                    <button
                      key={loc.name}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
                      onMouseDown={() => { setToInput(loc.name); setShowToSugg(false); }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 text-center text-sm">{CATEGORY_EMOJI[loc.category || "area"] || "📍"}</span>
                        {loc.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{loc.source === "nominatim" ? "🌐 " : ""}{loc.area}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Button */}
            <Button
              className="w-full h-11 mt-2 font-semibold"
              onClick={handleSearch}
              disabled={!fromInput || !toInput || fromInput === toInput}
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Find Best Routes
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {routeLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-md" />
            ))}
          </div>
        )}

        {/* Station Info */}
        {routeData && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline" className="gap-1">
              <CircleDotIcon className="w-2.5 h-2.5 text-green-500" />
              Nearest metro: <strong>{routeData.nearestSourceStation.name}</strong> ({routeData.nearestSourceStation.distanceKm} km)
            </Badge>
            <Badge variant="outline" className="gap-1">
              <MapPinIcon className="w-2.5 h-2.5 text-red-500" />
              Nearest metro: <strong>{routeData.nearestDestStation.name}</strong> ({routeData.nearestDestStation.distanceKm} km)
            </Badge>
          </div>
        )}

        {/* Route Cards */}
        {routeData?.routes.map((route, idx) => {
          const isExpanded = expandedRoute === idx;

          return (
            <Card
              key={route.type}
              className={`overflow-hidden border transition-all cursor-pointer ${ROUTE_ACCENT[route.type] || ""}`}
              onClick={() => setExpandedRoute(isExpanded ? null : idx)}
            >
              {/* Route Header */}
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] border ${ROUTE_BADGE[route.type] || ""}`}>
                      {route.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{route.description}</span>
                  </div>
                  {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <ClockIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {route.totalTime} min
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <IndianRupeeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    ₹{route.totalFare}
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    {route.legs.map((leg, li) => {
                      const Icon = MODE_ICONS[leg.mode] || ZapIcon;
                      return (
                        <span key={li} className="flex items-center gap-0.5">
                          {li > 0 && <ArrowRightIcon className="w-2.5 h-2.5 text-muted-foreground/50" />}
                          <Icon className="w-3.5 h-3.5" style={{ color: MODE_COLORS[leg.mode] }} />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Legs Timeline */}
              {isExpanded && (
                <CardContent className="pt-1 pb-4 px-4">
                  <div className="space-y-0 mt-2">
                    {route.legs.map((leg, li) => {
                      const Icon = MODE_ICONS[leg.mode] || ZapIcon;
                      const color = MODE_COLORS[leg.mode];
                      const isLast = li === route.legs.length - 1;

                      return (
                        <div key={li} className="flex gap-3">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center flex-shrink-0 w-6">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Icon className="w-3 h-3" style={{ color }} />
                            </div>
                            {!isLast && (
                              <div className="w-0.5 flex-1 min-h-[24px]" style={{ backgroundColor: `${color}40` }} />
                            )}
                          </div>
                          {/* Leg Details */}
                          <div className={`flex-1 ${!isLast ? "pb-3" : ""}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] font-semibold" style={{ color }}>
                                {MODE_LABELS[leg.mode]}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <ClockIcon className="w-2.5 h-2.5" /> {leg.duration} min
                              </span>
                              {leg.fare > 0 ? (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <WalletIcon className="w-2.5 h-2.5" /> ₹{leg.fare}
                                </span>
                              ) : (
                                <span className="text-[10px] text-green-500 font-medium">Free</span>
                              )}
                            </div>
                            <p className="text-xs mt-1 text-foreground/80 leading-relaxed">
                              {leg.instruction}
                            </p>
                            {/* Metro stations mini list */}
                            {leg.mode === "metro" && leg.stations && leg.stations.length > 0 && (
                              <div className="mt-2 pl-2 border-l-2 space-y-0.5" style={{ borderColor: `${color}60` }}>
                                {leg.stations.length <= 6
                                  ? leg.stations.map((s, si) => (
                                      <div key={s.id} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                        <div
                                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: s.line === "purple" ? "#7B2D8E" : "#00A651" }}
                                        />
                                        {s.name}
                                        {si === 0 && <span className="text-primary font-medium ml-1">Board</span>}
                                        {si === leg.stations!.length - 1 && <span className="text-destructive font-medium ml-1">Alight</span>}
                                      </div>
                                    ))
                                  : <>
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: leg.stations[0].line === "purple" ? "#7B2D8E" : "#00A651" }} />
                                        {leg.stations[0].name} <span className="text-primary font-medium ml-1">Board</span>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground/60 pl-3">
                                        ... {leg.stations.length - 2} stations ...
                                      </div>
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: leg.stations[leg.stations.length - 1].line === "purple" ? "#7B2D8E" : "#00A651" }} />
                                        {leg.stations[leg.stations.length - 1].name} <span className="text-destructive font-medium ml-1">Alight</span>
                                      </div>
                                    </>
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fare Breakdown Bar */}
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground mb-2 font-medium">Fare Breakdown</p>
                    <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden">
                      {route.legs.filter(l => l.fare > 0 || l.mode === "walk").map((leg, li) => {
                        const pct = route.totalFare > 0 ? Math.max((leg.fare / route.totalFare) * 100, 8) : 100 / route.legs.length;
                        return (
                          <div
                            key={li}
                            className="h-full rounded-sm relative group"
                            style={{ width: `${pct}%`, backgroundColor: MODE_COLORS[leg.mode], opacity: 0.7 }}
                            title={`${MODE_LABELS[leg.mode]}: ₹${leg.fare}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {route.legs.map((leg, li) => (
                        <span key={li} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: MODE_COLORS[leg.mode], opacity: 0.7 }} />
                          {MODE_LABELS[leg.mode]}: {leg.fare > 0 ? `₹${leg.fare}` : "Free"}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Empty State */}
        {!routeLoading && !routeData && (
          <Card>
            <CardContent className="py-12 text-center">
              <NavigationIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Enter your source and destination to find the best multimodal routes
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                We combine Metro, Bus, Auto & Cab for the perfect journey
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
