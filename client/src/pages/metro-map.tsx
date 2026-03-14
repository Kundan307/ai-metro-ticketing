import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapIcon, ClockIcon, TrainFrontIcon } from "lucide-react";
import type { Station } from "@shared/schema";
import { getLineColor, getCrowdColor } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";

interface TrainState {
  id: string;
  line: "purple" | "green";
  positionIndex: number;
  direction: 1 | -1;
  terminus: string;
}

function interpolatePosition(
  stations: Station[],
  posIndex: number
): [number, number] {
  const idx = Math.floor(posIndex);
  const frac = posIndex - idx;
  if (idx >= stations.length - 1) {
    const s = stations[stations.length - 1];
    return [s.lat, s.lng];
  }
  if (idx < 0) {
    const s = stations[0];
    return [s.lat, s.lng];
  }
  const a = stations[idx];
  const b = stations[idx + 1];
  return [a.lat + (b.lat - a.lat) * frac, a.lng + (b.lng - a.lng) * frac];
}

export default function MetroMap() {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const trainMarkersRef = useRef<any[]>([]);
  const trainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trainStateRef = useRef<TrainState[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showLiveTrains, setShowLiveTrains] = useState(true);

  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!mapRef.current || !stations?.length) return;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      leafletRef.current = L;

      if (mapInstanceRef.current) return;

      const map = L.map(mapRef.current!, {
        center: [12.9767, 77.5713], // Centralized on Majestic (Interchange)
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const purpleStations = stations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
      const greenStations = stations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);

      if (purpleStations.length > 1) {
        L.polyline(purpleStations.map((s): [number, number] => [s.lat, s.lng]), {
          color: "#7B2D8E", weight: 5, opacity: 0.8,
        }).addTo(map);
      }
      if (greenStations.length > 1) {
        L.polyline(greenStations.map((s): [number, number] => [s.lat, s.lng]), {
          color: "#00A651", weight: 5, opacity: 0.8,
        }).addTo(map);
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (trainIntervalRef.current) {
        clearInterval(trainIntervalRef.current);
        trainIntervalRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        leafletRef.current = null;
      }
    };
  }, [stations]); // Add stations to dependency array since polylines depend on them

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || !stations?.length) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    const purpleSorted = stations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
    const greenSorted = stations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);

    if (trainStateRef.current.length === 0) {
      const purpleTerminusForward = purpleSorted[purpleSorted.length - 1]?.name ?? "Challaghatta";
      const purpleTerminusBackward = purpleSorted[0]?.name ?? "Whitefield";
      const greenTerminusForward = greenSorted[greenSorted.length - 1]?.name ?? "Silk Institute";
      const greenTerminusBackward = greenSorted[0]?.name ?? "Madavara";

      trainStateRef.current = [
        { id: "p1", line: "purple", positionIndex: 5, direction: 1, terminus: purpleTerminusForward },
        { id: "p2", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.3), direction: -1, terminus: purpleTerminusBackward },
        { id: "p3", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.6), direction: 1, terminus: purpleTerminusForward },
        { id: "p4", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.8), direction: -1, terminus: purpleTerminusBackward },
        { id: "g1", line: "green", positionIndex: 4, direction: 1, terminus: greenTerminusForward },
        { id: "g2", line: "green", positionIndex: Math.floor(greenSorted.length * 0.35), direction: -1, terminus: greenTerminusBackward },
        { id: "g3", line: "green", positionIndex: Math.floor(greenSorted.length * 0.65), direction: 1, terminus: greenTerminusForward },
        { id: "g4", line: "green", positionIndex: Math.floor(greenSorted.length * 0.85), direction: -1, terminus: greenTerminusBackward },
      ];
    }

    function createTrainIcon(line: "purple" | "green", direction: 1 | -1) {
      const color = line === "purple" ? "#7B2D8E" : "#00A651";
      const arrow = direction === 1 ? "&#9654;" : "&#9664;";
      return L.divIcon({
        className: "train-marker",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);color:#fff;font-size:10px;font-weight:700;">${arrow}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    function updateTrainMarkers() {
      trainMarkersRef.current.forEach((m) => map.removeLayer(m));
      trainMarkersRef.current = [];

      if (!showLiveTrains) return;

      trainStateRef.current.forEach((train) => {
        const lineStations = train.line === "purple" ? purpleSorted : greenSorted;
        if (lineStations.length < 2) return;

        const pos = interpolatePosition(lineStations, train.positionIndex);
        const icon = createTrainIcon(train.line, train.direction);
        const marker = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
        marker.bindTooltip(`Train to ${train.terminus}`, {
          permanent: false,
          direction: "top",
          offset: [0, -14],
        });
        trainMarkersRef.current.push(marker);
      });
    }

    function advanceTrains() {
      trainStateRef.current = trainStateRef.current.map((train) => {
        const lineStations = train.line === "purple" ? purpleSorted : greenSorted;
        const maxIdx = lineStations.length - 1;

        let newPos = train.positionIndex + train.direction * 0.7;
        let newDir = train.direction;
        let newTerminus = train.terminus;

        if (newPos >= maxIdx) {
          newPos = maxIdx;
          newDir = -1;
          newTerminus = lineStations[0]?.name ?? train.terminus;
        } else if (newPos <= 0) {
          newPos = 0;
          newDir = 1;
          newTerminus = lineStations[maxIdx]?.name ?? train.terminus;
        }

        return { ...train, positionIndex: newPos, direction: newDir as 1 | -1, terminus: newTerminus };
      });

      updateTrainMarkers();
    }

    updateTrainMarkers();

    if (trainIntervalRef.current) clearInterval(trainIntervalRef.current);
    trainIntervalRef.current = setInterval(advanceTrains, 3000);

    return () => {
      if (trainIntervalRef.current) {
        clearInterval(trainIntervalRef.current);
        trainIntervalRef.current = null;
      }
    };
  }, [stations, showLiveTrains]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current || !stations?.length) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    stations.forEach((station) => {
      const crowdColor = getCrowdColor(station.crowdLevel);
      const lineColor = getLineColor(station.line);

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${lineColor};border:3px solid ${crowdColor};box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([station.lat, station.lng], { icon }).addTo(map);

      const nextTrains = [
        Math.floor(Math.random() * 5) + 1,
        Math.floor(Math.random() * 8) + 4,
        Math.floor(Math.random() * 12) + 8,
      ].sort((a: number, b: number) => a - b);

      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:180px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${station.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${lineColor};display:inline-block;"></span>
            <span style="font-size:11px;color:#666;text-transform:capitalize;">${station.line} Line</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${crowdColor};display:inline-block;"></span>
            <span style="font-size:11px;color:#666;">Crowd: <strong style="text-transform:capitalize;">${station.crowdLevel}</strong></span>
          </div>
          <div style="font-size:11px;color:#666;margin-bottom:2px;">Passengers: <strong>${station.passengerCount}</strong></div>
          <div style="font-size:11px;color:#666;border-top:1px solid #eee;padding-top:4px;margin-top:4px;">
            Next trains: ${nextTrains.map((t: number) => `${t} min`).join(", ")}
          </div>
        </div>
      `);

      marker.on("click", () => setSelectedStation(station));
      markersRef.current.push(marker);
    });
  }, [stations]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] rounded-md" />
      </div>
    );
  }

  const purpleStations = stations?.filter((s) => s.line === "purple") ?? [];
  const greenStations = stations?.filter((s) => s.line === "green") ?? [];

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-map-title">
          {t("map.title")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("map.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7B2D8E" }} />
          <span className="text-xs font-medium">Purple Line ({purpleStations.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00A651" }} />
          <span className="text-xs font-medium">Green Line ({greenStations.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFD700" }} />
          <span className="text-xs text-muted-foreground">Yellow Line (Upcoming)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF69B4" }} />
          <span className="text-xs text-muted-foreground">Pink Line (Upcoming)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0072CE" }} />
          <span className="text-xs text-muted-foreground">Blue Line - Airport (Upcoming)</span>
        </div>
        <div className="flex items-center gap-2 ml-auto" data-testid="div-live-trains-toggle">
          <TrainFrontIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <Label htmlFor="live-trains" className="text-xs font-medium cursor-pointer">
            {t("map.liveTrains")}
          </Label>
          <Switch
            id="live-trains"
            checked={showLiveTrains}
            onCheckedChange={setShowLiveTrains}
            data-testid="switch-live-trains"
          />
          {showLiveTrains && (
            <Badge variant="secondary" className="text-[10px]" data-testid="badge-live-indicator">
              LIVE
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div
                ref={mapRef}
                className="h-[500px] rounded-md"
                data-testid="div-metro-map"
                style={{ zIndex: 0 }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedStation ? (
            <Card data-testid="card-station-info">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrainFrontIcon className="w-4 h-4" />
                  {selectedStation.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLineColor(selectedStation.line) }} />
                  <span className="text-xs capitalize">{selectedStation.line} Line</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">Crowd Level</span>
                  <Badge
                    variant={selectedStation.crowdLevel === "high" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {selectedStation.crowdLevel}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">Passengers</span>
                  <span className="text-sm font-semibold">{selectedStation.passengerCount}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Next Trains
                  </p>
                  <div className="space-y-1">
                    {[2, 6, 12].map((min) => (
                      <div key={min} className="flex items-center justify-between gap-1">
                        <span className="text-xs text-muted-foreground">Train</span>
                        <span className="text-xs font-medium">{min} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MapIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Click a station on the map to view details
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Crowd Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { level: "Low", color: "#22c55e", desc: "< 200 passengers" },
                { level: "Medium", color: "#eab308", desc: "200-500 passengers" },
                { level: "High", color: "#ef4444", desc: "> 500 passengers" },
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium">{item.level}</span>
                  <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
