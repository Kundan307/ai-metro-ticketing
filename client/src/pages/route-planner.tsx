import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NavigationIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  ClockIcon,
  UsersIcon,
  TrainFrontIcon,
  CircleDotIcon,
  MapPinIcon,
  ZapIcon,
  ShieldIcon,
  RepeatIcon,
} from "lucide-react";
import { getCrowdBadgeVariant } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";
import type { Station } from "@shared/schema";

interface RouteStation {
  id: number;
  name: string;
  line: string;
  crowdLevel: string;
  isTransfer: boolean;
  platform: number;
}

interface RouteOption {
  type: string;
  label: string;
  description: string;
  stations: RouteStation[];
  travelTimeMinutes: number;
  transfers: number;
  transferStation: string | null;
  transferPlatforms?: { from: number; to: number };
  estimatedFare?: number;
  crowdScore?: number;
  bestTimeToTravel?: string;
  stationCount?: number;
}

interface RouteResponse {
  source: { id: number; name: string; line: string };
  destination: { id: number; name: string; line: string };
  routes: RouteOption[];
}

const routeIcons: Record<string, typeof ZapIcon> = {
  fastest: ZapIcon,
  least_crowded: ShieldIcon,
  min_transfers: RepeatIcon,
};

const routeColors: Record<string, string> = {
  fastest: "text-chart-1",
  least_crowded: "text-chart-2",
  min_transfers: "text-chart-4",
};

export default function RoutePlanner() {
  const { t } = useTranslation();
  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");

  const { data: stations, isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: routeData, isLoading: routeLoading } = useQuery<RouteResponse>({
    queryKey: ["/api/route", sourceId, destId],
    queryFn: async () => {
      const res = await fetch(`/api/route?sourceId=${sourceId}&destId=${destId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch route");
      return res.json();
    },
    enabled: !!sourceId && !!destId && sourceId !== destId,
  });

  const purpleStations = stations?.filter((s) => s.line === "purple") ?? [];
  const greenStations = stations?.filter((s) => s.line === "green") ?? [];

  const swapStations = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  if (stationsLoading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" data-testid="text-route-planner-title">
            <NavigationIcon className="w-5 h-5 text-primary" />
            {t("routePlanner.title")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("routePlanner.subtitle")}
          </p>
        </div>

        <Card data-testid="card-route-select">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <CircleDotIcon className="w-3 h-3 text-chart-2" />
                {t("label.from")}
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger data-testid="select-route-source" className="h-11">
                  <SelectValue placeholder={t("routePlanner.selectDeparture")} />
                </SelectTrigger>
                <SelectContent>
                  {purpleStations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7B2D8E" }} />
                        {t("routePlanner.purpleLine")}
                      </div>
                      {purpleStations.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-route-source-${s.id}`}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {greenStations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00A651" }} />
                        {t("routePlanner.greenLine")}
                      </div>
                      {greenStations.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-route-source-${s.id}`}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={swapStations}
                disabled={!sourceId || !destId}
                data-testid="button-swap-route-stations"
              >
                <ArrowUpDownIcon className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPinIcon className="w-3 h-3 text-destructive" />
                {t("label.to")}
              </Label>
              <Select value={destId} onValueChange={setDestId}>
                <SelectTrigger data-testid="select-route-dest" className="h-11">
                  <SelectValue placeholder={t("routePlanner.selectArrival")} />
                </SelectTrigger>
                <SelectContent>
                  {purpleStations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7B2D8E" }} />
                        Purple Line
                      </div>
                      {purpleStations.filter((s) => String(s.id) !== sourceId).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-route-dest-${s.id}`}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {greenStations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00A651" }} />
                        Green Line
                      </div>
                      {greenStations.filter((s) => String(s.id) !== sourceId).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-route-dest-${s.id}`}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {sourceId && destId && sourceId === destId && (
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground text-center" data-testid="text-same-station-warning">
                {t("routePlanner.differentStations")}
              </p>
            </CardContent>
          </Card>
        )}

        {routeLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-md" />
            ))}
          </div>
        )}

        {routeData && (
          <div className="space-y-4" data-testid="container-route-results">
            <div className="flex items-center gap-2">
              <TrainFrontIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {routeData.source.name}
              </span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {routeData.destination.name}
              </span>
            </div>

            {routeData.routes.map((route, idx) => {
              const RouteIcon = routeIcons[route.type] || ZapIcon;
              const colorClass = routeColors[route.type] || "text-primary";

              return (
                <Card key={route.type} data-testid={`card-route-option-${route.type}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <RouteIcon className={`w-4 h-4 ${colorClass}`} />
                        <span>{route.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]" data-testid={`badge-travel-time-${route.type}`}>
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {route.travelTimeMinutes} min
                        </Badge>
                        {route.transfers > 0 && (
                          <Badge variant="outline" className="text-[10px]" data-testid={`badge-transfers-${route.type}`}>
                            <RepeatIcon className="w-3 h-3 mr-1" />
                            {route.transfers} {t("routePlanner.transfer")}
                          </Badge>
                        )}
                        {route.transfers === 0 && (
                          <Badge variant="outline" className="text-[10px]" data-testid={`badge-direct-${route.type}`}>
                            {t("routePlanner.direct")}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{route.description}</p>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-0">
                      {route.stations.map((station, sIdx) => {
                        const isFirst = sIdx === 0;
                        const isLast = sIdx === route.stations.length - 1;
                        const lineColor = station.line === "purple" ? "#7B2D8E" : "#00A651";
                        const prevStation = sIdx > 0 ? route.stations[sIdx - 1] : null;
                        const lineChanged = prevStation && prevStation.line !== station.line;
                        const showPlatform = isFirst || isLast || station.isTransfer || lineChanged;

                        return (
                          <div key={`${station.id}-${sIdx}`}>
                            {lineChanged && (
                              <div className="flex items-start gap-3 mb-0.5">
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <div className="w-0.5 h-3" style={{ backgroundColor: lineColor }} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px] border-dashed">
                                    {t("routePlanner.switchToPlatform")} {station.platform}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground capitalize">
                                    {t(`routePlanner.${station.line}Line`)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3" data-testid={`route-station-${route.type}-${station.id}`}>
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                  className="w-3 h-3 rounded-full border-2"
                                  style={{
                                    borderColor: lineColor,
                                    backgroundColor: (isFirst || isLast || station.isTransfer) ? lineColor : "transparent",
                                  }}
                                />
                                {!isLast && (
                                  <div
                                    className="w-0.5 h-5"
                                    style={{ backgroundColor: lineColor }}
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2 pb-1 min-w-0 flex-wrap">
                                <span className={`text-xs ${(isFirst || isLast) ? "font-semibold" : "text-muted-foreground"}`}>
                                  {station.name}
                                </span>
                                {showPlatform && (
                                  <span className="text-[10px] text-muted-foreground" data-testid={`text-platform-${route.type}-${station.id}`}>
                                    P{station.platform}
                                  </span>
                                )}
                                {station.isTransfer && (
                                  <Badge variant="outline" className="text-[9px]">
                                    {t("routePlanner.transfer")}
                                  </Badge>
                                )}
                                <Badge
                                  variant={getCrowdBadgeVariant(station.crowdLevel)}
                                  className="text-[9px]"
                                >
                                  <UsersIcon className="w-2.5 h-2.5 mr-0.5" />
                                  {station.crowdLevel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                      <span data-testid={`text-station-count-${route.type}`}>
                        {route.stations.length} {t("routePlanner.stations")}
                      </span>
                      {route.transferStation && (
                        <span data-testid={`text-transfer-station-${route.type}`}>
                          {t("routePlanner.transferAt")} {route.transferStation}
                          {route.transferPlatforms && ` (P${route.transferPlatforms.from} → P${route.transferPlatforms.to})`}
                        </span>
                      )}
                      {route.estimatedFare != null && (
                        <span data-testid={`text-fare-${route.type}`}>
                          {t("routePlanner.estFare")}: ₹{route.estimatedFare}
                        </span>
                      )}
                      {route.bestTimeToTravel && (
                        <span className="text-primary font-medium" data-testid={`text-best-time-${route.type}`}>
                          {t("routePlanner.bestTime")}: {route.bestTimeToTravel}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
