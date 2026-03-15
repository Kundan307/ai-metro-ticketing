import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SparklesIcon,
  TrendingUpIcon,
  ClockIcon,
  MapPinIcon,
  BrainCircuitIcon,
  ZapIcon,
  RouteIcon,
  LightbulbIcon,
  IndianRupeeIcon,
  ActivityIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Station } from "@shared/schema";

export default function AIInsights() {
  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    refetchInterval: 10000,
  });

  const { data: insights } = useQuery<{
    demandPredictions: {
      station: string;
      currentLevel: string;
      predictedLevel: string;
      confidence: number;
    }[];
    recommendations: {
      type: string;
      title: string;
      description: string;
      impact: string;
    }[];
    anomalies: {
      type: string;
      description: string;
      severity: string;
      timestamp: string;
    }[];
    pricingInsights: {
      avgMultiplier: number;
      peakHours: string[];
      revenueLift: number;
    };
    trendData: {
      time: string;
      predicted: number;
      actual: number | null;
    }[];
  }>({
    queryKey: ["/api/insights"],
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-md" />
        ))}
      </div>
    );
  }

  const leastCrowdedStations = stations
    ? [...stations].sort((a, b) => a.passengerCount - b.passengerCount).slice(0, 5)
    : [];

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full space-y-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-insights-title">
          AI Travel Insights
        </h1>
        <p className="text-xs text-muted-foreground">
          Smart recommendations to save time and money on your metro commute
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BrainCircuitIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI Models Active</p>
                <p className="text-xl font-bold">4</p>
                <p className="text-[10px] text-muted-foreground">Demand, Pricing, Route, Crowd</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-4/10">
                <IndianRupeeIcon className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Surge</p>
                <p className="text-xl font-bold">{insights?.pricingInsights?.avgMultiplier?.toFixed(2) ?? "1.00"}x</p>
                <p className="text-[10px] text-muted-foreground">Average across network</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
                <LightbulbIcon className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tips Available</p>
                <p className="text-xl font-bold">{insights?.recommendations?.length ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Personalized for you</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recommendations">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Smart Travel Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(insights?.recommendations ?? []).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5" style={{
                background: rec.type === "timing" ? "hsl(var(--primary) / 0.1)" : rec.type === "route" ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--chart-4) / 0.1)"
              }}>
                {rec.type === "timing" && <ClockIcon className="w-4 h-4 text-primary" />}
                {rec.type === "route" && <RouteIcon className="w-4 h-4 text-chart-2" />}
                {rec.type === "pricing" && <ZapIcon className="w-4 h-4 text-chart-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{rec.title}</span>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{rec.impact}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
              </div>
            </div>
          ))}
          {(!insights?.recommendations || insights.recommendations.length === 0) && (
            <p className="text-center text-xs text-muted-foreground py-4">Loading recommendations...</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-demand-predictions">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Crowd Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(insights?.demandPredictions ?? []).map((pred, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{pred.station}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px]">{pred.currentLevel}</Badge>
                  <span className="text-muted-foreground text-[10px]">→</span>
                  <Badge
                    variant={pred.predictedLevel === "high" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {pred.predictedLevel}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{pred.confidence}%</span>
                </div>
              </div>
            ))}
            {(!insights?.demandPredictions || insights.demandPredictions.length === 0) && (
              <p className="text-center text-xs text-muted-foreground py-4">Loading predictions...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-chart-2" />
              Best Stations to Travel Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {leastCrowdedStations.map((station, i) => (
              <div key={station.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    backgroundColor: station.line === "purple" ? "#7B2D8E" : "#00A651"
                  }} />
                  <span className="text-xs font-medium truncate">{station.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-muted-foreground">{station.passengerCount} pax</span>
                  <Badge variant="secondary" className="text-[10px] bg-chart-2/10 text-chart-2">
                    {station.crowdLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 lg:col-span-2 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-primary" />
                Network Crowd Trend
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Predicted vs. actual passenger volume across the network.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" /> Actual
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full border border-primary border-dashed" /> Predicted
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-2 pl-0">
          <div className="h-[200px] w-full">
            {!insights || !insights.trendData || insights.trendData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                Loading trend data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px"
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    name="Predicted Volume"
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Volume"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
