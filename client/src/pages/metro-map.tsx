import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapIcon, ClockIcon, TrainFrontIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, MapPinIcon } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { Station } from "@shared/schema";
import { getLineColor, getCrowdColor } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";
import { StationCoordinates } from "@/lib/metro-map-coords";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import metroTracks from "@/lib/metro-tracks.json";

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom div icon for stations
const createStationIcon = (color: string, crowdColor: string, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-station-marker',
    html: `<div style="
      width: ${isSelected ? '20px' : '14px'};
      height: ${isSelected ? '20px' : '14px'};
      background-color: ${color};
      border: 2px solid ${crowdColor};
      border-radius: 50%;
      box-shadow: ${isSelected ? '0 0 0 3px white, 0 0 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)'};
      transition: all 0.2s ease;
    "></div>`,
    iconSize: [isSelected ? 20 : 14, isSelected ? 20 : 14],
    iconAnchor: [isSelected ? 10 : 7, isSelected ? 10 : 7],
  });
};

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
  const [mapView, setMapView] = useState<"schematic" | "geographic">("geographic");

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

  const purpleStations = (stations?.filter((s) => s.line === "purple") ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
  const greenStations = (stations?.filter((s) => s.line === "green") ?? []).sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-map-title">
            {t("map.title")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("map.subtitle")}
          </p>
        </div>
        
        <Tabs value={mapView} onValueChange={(v) => setMapView(v as any)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schematic">Schematic</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
          </TabsList>
        </Tabs>
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
                className="h-[500px] rounded-md overflow-hidden relative"
                data-testid="div-metro-map"
                style={{ zIndex: 0 }}
              >
                {mapView === "schematic" ? (
                  <div className="w-full h-full bg-[#121620]">
                    <TransformWrapper
                      initialScale={1}
                      minScale={0.5}
                      maxScale={4}
                      centerOnInit
                    >
                      {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-lg border shadow-sm">
                            <button onClick={() => zoomIn()} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Zoom In">
                              <ZoomInIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => zoomOut()} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Zoom Out">
                              <ZoomOutIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => resetTransform()} className="p-1.5 hover:bg-muted rounded-md transition-colors" title="Reset View">
                              <MaximizeIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                            <div className="relative w-[1000px] h-[1000px]">
                              <img
                                src="/namma-metro-map.svg"
                                alt="Namma Metro Network Map"
                                className="w-full h-full object-contain pointer-events-none select-none"
                                draggable={false}
                              />
                              
                              {/* Static Station Nodes */}
                              {stations?.map((station) => {
                                const coords = StationCoordinates[station.name];
                                if (!coords) return null;
                                const isSelected = selectedStation?.id === station.id;
                                const color = getLineColor(station.line);
                                const crowdColor = getCrowdColor(station.crowdLevel);

                                return (
                                  <div
                                    key={station.id}
                                    className={`absolute flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-150 z-40 ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-150' : 'scale-100'}`}
                                    style={{
                                      left: `${coords.x}%`,
                                      top: `${coords.y}%`,
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: color,
                                      border: `2px solid ${crowdColor}`,
                                      transform: 'translate(-50%, -50%)',
                                    }}
                                    onClick={() => setSelectedStation(station)}
                                    title={`${station.name} (${station.crowdLevel} crowd)`}
                                  />
                                );
                              })}

                              {/* Live Train Overlay */}
                              {showLiveTrains && trainStates.map((train) => {
                                const lineStations = train.line === "purple" ? purpleStations : greenStations;
                                if (lineStations.length < 2) return null;
                                const [x, y] = interpolatePosition(lineStations, train.positionIndex);
                                const color = train.line === "purple" ? "#7B2D8E" : "#00A651";
                                return (
                                  <div
                                    key={train.id}
                                    className="absolute flex items-center justify-center rounded-full text-white text-[10px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-all duration-3000 ease-linear z-50 pointer-events-none"
                                    style={{
                                      left: `${x}%`,
                                      top: `${y}%`,
                                      width: '24px',
                                      height: '24px',
                                      backgroundColor: color,
                                      border: '2px solid #fff',
                                      transform: 'translate(-50%, -50%)',
                                    }}
                                  >
                                    {train.direction === 1 ? '▶' : '◀'}
                                  </div>
                                );
                              })}
                            </div>
                          </TransformComponent>
                        </>
                      )}
                    </TransformWrapper>
                  </div>
                ) : (
                  <div className="w-full h-full z-0 relative bg-background">
                    <MapContainer
                      center={[12.978, 77.585]}
                      zoom={11}
                      minZoom={10}
                      maxBounds={[
                        [12.6, 77.3], // South-West
                        [13.2, 77.8]  // North-East
                      ]}
                      maxBoundsViscosity={1.0}
                      style={{ height: "100%", width: "100%", zIndex: 0 }}
                      zoomControl={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      />
                      
                      {/* Draw actual track geometries */}
                      {metroTracks.purple.map((positions, idx) => (
                        <Polyline 
                          key={`purple-track-${idx}`}
                          positions={positions as [number, number][]} 
                          color="#7B2D8E" 
                          weight={5} 
                          opacity={0.8} 
                        />
                      ))}
                      {metroTracks.green.map((positions, idx) => (
                        <Polyline 
                          key={`green-track-${idx}`}
                          positions={positions as [number, number][]} 
                          color="#00A651" 
                          weight={5} 
                          opacity={0.8} 
                        />
                      ))}

                      {stations?.map((station) => {
                        const isSelected = selectedStation?.id === station.id;
                        const color = getLineColor(station.line);
                        const crowdColor = getCrowdColor(station.crowdLevel);
                        
                        return (
                          <Marker
                            key={station.id}
                            position={[station.lat, station.lng]}
                            icon={createStationIcon(color, crowdColor, isSelected)}
                            eventHandlers={{
                              click: () => setSelectedStation(station),
                            }}
                          >
                            <Popup>
                              <div className="text-sm font-semibold">{station.name}</div>
                              <div className="text-xs capitalize text-muted-foreground">{station.line} Line</div>
                              <div className="text-xs">Crowd level: <span className="font-medium">{station.crowdLevel}</span></div>
                            </Popup>
                          </Marker>
                        );
                      })}

                      {/* Live Train Overlay geographic bounds */}
                      {showLiveTrains && trainStates.map((train) => {
                        const lineStations = train.line === "purple" ? purpleStations : greenStations;
                        if (lineStations.length < 2) return null;
                        
                        // We need a geographical interpolation for true live positions
                        const idx = Math.floor(train.positionIndex);
                        const frac = train.positionIndex - idx;
                        const s1 = lineStations[idx];
                        const s2 = lineStations[idx + 1];
                        
                        if (!s1 || !s2) return null;
                        
                        const lat = s1.lat + (s2.lat - s1.lat) * frac;
                        const lng = s1.lng + (s2.lng - s1.lng) * frac;
                        const color = train.line === "purple" ? "#7B2D8E" : "#00A651";

                        const trainIcon = L.divIcon({
                          className: 'custom-train-marker',
                          html: `<div style="
                            width: 20px;
                            height: 20px;
                            background-color: ${color};
                            border: 2px solid white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 8px;
                            font-weight: bold;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                            transition: all 3s linear;
                          ">${train.direction === 1 ? '▶' : '◀'}</div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                        });

                        return (
                          <Marker 
                            key={`train-${train.id}`} 
                            position={[lat, lng]} 
                            icon={trainIcon} 
                            zIndexOffset={1000} // Keep trains on top of stations
                          />
                        );
                      })}
                    </MapContainer>
                  </div>
                )}
              </div>
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
