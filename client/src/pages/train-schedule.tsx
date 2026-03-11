import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClockIcon, TrainFrontIcon } from "lucide-react";
import type { Station } from "@shared/schema";

function generateSchedule(station: Station) {
  const now = new Date();
  const schedules = [];
  for (let i = 0; i < 5; i++) {
    const minutes = Math.floor(Math.random() * 8) + 1 + i * 4;
    const time = new Date(now.getTime() + minutes * 60000);
    schedules.push({
      time: time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      minutesAway: minutes,
      platform: Math.random() > 0.5 ? 1 : 2,
      direction: i % 2 === 0 ? "Towards Terminal" : "Towards Start",
    });
  }
  return schedules;
}

export default function TrainSchedule() {
  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>
    );
  }

  const purpleStations = stations?.filter((s) => s.line === "purple").sort((a, b) => a.orderIndex - b.orderIndex) ?? [];
  const greenStations = stations?.filter((s) => s.line === "green").sort((a, b) => a.orderIndex - b.orderIndex) ?? [];

  const renderStationList = (stationList: Station[], lineColor: string) => (
    <div className="space-y-2">
      {stationList.map((station) => {
        const schedules = generateSchedule(station);
        return (
          <Card key={station.id} data-testid={`card-schedule-${station.id}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lineColor }} />
                  <h3 className="text-sm font-semibold">{station.name}</h3>
                </div>
                <Badge
                  variant={station.crowdLevel === "high" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {station.crowdLevel}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {schedules.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-xs"
                  >
                    <ClockIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="font-semibold">{s.minutesAway} min</span>
                    <span className="text-muted-foreground text-[10px]">P{s.platform}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-schedule-title">
            Train Schedule
          </h1>
          <p className="text-xs text-muted-foreground">
            Next arriving trains at each station
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-chart-2/10 border border-chart-2/20">
          <div className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
          <span className="text-[11px] font-medium text-chart-2">Live</span>
        </div>
      </div>

      <Tabs defaultValue="purple">
        <TabsList>
          <TabsTrigger value="purple" data-testid="tab-purple-line" className="gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7B2D8E" }} />
            Purple Line
          </TabsTrigger>
          <TabsTrigger value="green" data-testid="tab-green-line" className="gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00A651" }} />
            Green Line
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purple" className="mt-3">
          {renderStationList(purpleStations, "#7B2D8E")}
        </TabsContent>

        <TabsContent value="green" className="mt-3">
          {renderStationList(greenStations, "#00A651")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
