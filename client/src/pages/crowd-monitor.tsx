import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  UsersIcon,
  ActivityIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  FilterIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Station, Ticket } from "@shared/schema";
import { getCrowdColor } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";

export default function CrowdMonitor() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "booked">("all");

  const { data: stations, isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    refetchInterval: 10000,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/my"],
    enabled: filter === "booked",
  });

  const isLoading = stationsLoading || (filter === "booked" && ticketsLoading);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const activeTickets = tickets?.filter(t => t.status === 'active') ?? [];
  const bookedStationIds = new Set<number>();
  activeTickets.forEach(t => {
    bookedStationIds.add(t.sourceStationId);
    bookedStationIds.add(t.destStationId);
  });

  const filteredStations = stations?.filter(s => {
    if (filter === "all") return true;
    return bookedStationIds.has(s.id);
  }) ?? [];

  const lowCount = stations?.filter((s) => s.crowdLevel === "low").length ?? 0;
  const medCount = stations?.filter((s) => s.crowdLevel === "medium").length ?? 0;
  const highCount = stations?.filter((s) => s.crowdLevel === "high").length ?? 0;
  const totalPassengers = stations?.reduce((sum, s) => sum + s.passengerCount, 0) ?? 0;

  const topStations = filteredStations
    ? [...filteredStations].sort((a, b) => b.passengerCount - a.passengerCount).slice(0, 10)
    : [];

  const crowdedStations = filteredStations?.filter((s) => s.crowdLevel === "high") ?? [];

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-crowd-title">
            {t("crowd.title")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("crowd.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Filter stations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              <SelectItem value="booked">My Booked Stations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("crowd.total")}</p>
                <p className="text-xl font-bold">{totalPassengers.toLocaleString()}</p>
              </div>
              <UsersIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("crowd.low")}</p>
                <p className="text-xl font-bold" style={{ color: "#22c55e" }}>{lowCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("crowd.medium")}</p>
                <p className="text-xl font-bold" style={{ color: "#eab308" }}>{medCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#eab308" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("crowd.high")}</p>
                <p className="text-xl font-bold" style={{ color: "#ef4444" }}>{highCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {crowdedStations.length > 0 ? (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangleIcon className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {t("crowd.alert")} - {crowdedStations.length} {crowdedStations.length > 1 ? t("routePlanner.stations") : t("ticket.platform")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {crowdedStations.map((s) => (
                <Badge key={s.id} variant="destructive" className="text-xs">
                  {s.name} ({s.passengerCount})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-chart-2/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-chart-2" />
              <span className="text-sm font-medium text-chart-2">
                {t("crowd.normalCapacity")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-crowd-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" />
              {t("crowd.busiestStations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="passengerCount" radius={[4, 4, 0, 0]}>
                    {topStations.map((station, idx) => (
                      <Cell key={idx} fill={getCrowdColor(station.crowdLevel)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cctv-simulation">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              {t("crowd.stationCapacity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topStations.slice(0, 6).map((station) => {
              const maxCapacity = 800;
              const percentage = Math.min((station.passengerCount / maxCapacity) * 100, 100);
              return (
                <div key={station.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate">{station.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{station.passengerCount}/{maxCapacity}</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-all-stations-crowd">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {filter === "all" ? t("crowd.allStations") : "Booked Stations"} ({filteredStations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {filteredStations?.sort((a, b) => b.passengerCount - a.passengerCount).map((station) => (
              <div
                key={station.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30"
                data-testid={`row-crowd-station-${station.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCrowdColor(station.crowdLevel) }}
                  />
                  <span className="text-xs font-medium truncate">{station.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums">{station.passengerCount}</span>
                  <Badge
                    variant={station.crowdLevel === "high" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {station.crowdLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
