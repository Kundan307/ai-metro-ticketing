import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapIcon, ClockIcon, TrainFrontIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Station } from "@shared/schema";
import { getLineColor, getCrowdColor } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";
import { StationCoordinates } from "@/lib/metro-map-coords";

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
  
  const getCoords = (s: Station | undefined) => {
    if (!s || !StationCoordinates[s.name]) return null;
    return StationCoordinates[s.name];
  };

  const a = getCoords(stations[idx]);
  const b = getCoords(stations[idx + 1]);

  if (!a) return [50, 50]; // fallback center
  if (!b) return [a.x, a.y];

  return [a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac];
}

export default function MetroMap() {
  const { t } = useTranslation();
  const trainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [trainStates, setTrainStates] = useState<TrainState[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showLiveTrains, setShowLiveTrains] = useState(true);

  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!stations?.length) return;

    const purpleSorted = stations.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex);
    const greenSorted = stations.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex);

    // Initialize trains once
    setTrainStates((prev) => {
      if (prev.length > 0) return prev;
      
      const pFwd = purpleSorted[purpleSorted.length - 1]?.name ?? "Challaghatta";
      const pBwd = purpleSorted[0]?.name ?? "Whitefield";
      const gFwd = greenSorted[greenSorted.length - 1]?.name ?? "Silk Institute";
      const gBwd = greenSorted[0]?.name ?? "Madavara";

      return [
        { id: "p1", line: "purple", positionIndex: 5, direction: 1, terminus: pFwd },
        { id: "p2", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.3), direction: -1, terminus: pBwd },
        { id: "p3", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.6), direction: 1, terminus: pFwd },
        { id: "p4", line: "purple", positionIndex: Math.floor(purpleSorted.length * 0.8), direction: -1, terminus: pBwd },
        { id: "g1", line: "green", positionIndex: 4, direction: 1, terminus: gFwd },
        { id: "g2", line: "green", positionIndex: Math.floor(greenSorted.length * 0.35), direction: -1, terminus: gBwd },
        { id: "g3", line: "green", positionIndex: Math.floor(greenSorted.length * 0.65), direction: 1, terminus: gFwd },
        { id: "g4", line: "green", positionIndex: Math.floor(greenSorted.length * 0.85), direction: -1, terminus: gBwd },
      ];
    });

    const advanceTrains = () => {
      setTrainStates((current) => current.map((train) => {
        const lineStations = train.line === "purple" ? purpleSorted : greenSorted;
        const maxIdx = lineStations.length - 1;

        let newPos = train.positionIndex + train.direction * 0.7; // Speed
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
      }));
    };

    if (trainIntervalRef.current) clearInterval(trainIntervalRef.current);
    trainIntervalRef.current = setInterval(advanceTrains, 3000);

    return () => {
      if (trainIntervalRef.current) {
        clearInterval(trainIntervalRef.current);
      }
    };
  }, [stations]);
  // The train markers are now strictly React state-driven, so leaflet imperative logic is completely removed.

  // The Leaflet map was removed, so we no longer need the secondary useEffect that plots Leaflet station markers. 

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
