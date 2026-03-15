import { useEffect, useState } from "react";
import { 
  CloudIcon, SunIcon, CloudRainIcon, CloudLightningIcon, 
  Loader2Icon, MapPinIcon, DropletsIcon, WindIcon, LeafIcon
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  aqi: number;
}

// Map WMO weather codes to icons and descriptions
const getWeatherInfo = (code: number, isDay: boolean) => {
  if (code === 0) return { icon: SunIcon, desc: "Clear Sky" };
  if (code >= 1 && code <= 3) return { icon: CloudIcon, desc: "Partly Cloudy" };
  if (code >= 51 && code <= 67) return { icon: CloudRainIcon, desc: "Rain" };
  if (code >= 71 && code <= 82) return { icon: CloudRainIcon, desc: "Snow/Showers" };
  if (code >= 95) return { icon: CloudLightningIcon, desc: "Thunderstorm" };
  return { icon: CloudIcon, desc: "Cloudy" };
};

const getAqiInfo = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "text-orange-500", bg: "bg-orange-500/10" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-500", bg: "bg-red-500/10" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-500", bg: "bg-purple-500/10" };
  return { label: "Hazardous", color: "text-rose-900", bg: "bg-rose-900/10" };
};

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetch("https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day"),
          fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=12.9716&longitude=77.5946&current=us_aqi")
        ]);

        if (weatherRes.ok && aqiRes.ok) {
          const wJson = await weatherRes.json();
          const aJson = await aqiRes.json();
          
          setData({
            temperature: Math.round(wJson.current.temperature_2m),
            humidity: Math.round(wJson.current.relative_humidity_2m),
            windSpeed: Math.round(wJson.current.wind_speed_10m),
            weatherCode: wJson.current.weather_code,
            isDay: wJson.current.is_day === 1,
            aqi: Math.round(aJson.current.us_aqi),
          });
        }
      } catch (e) {
        console.error("Failed to fetch weather", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
        <Loader2Icon className="w-4 h-4 animate-spin" />
        <span className="text-xs">Weather...</span>
      </div>
    );
  }

  if (!data) return null;

  const { icon: Icon, desc } = getWeatherInfo(data.weatherCode, data.isDay);
  const aqiInfo = getAqiInfo(data.aqi);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div 
          className="flex items-center gap-2 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-all px-3 py-1.5 rounded-full border border-border/50 cursor-pointer shadow-sm hover:shadow-md"
        >
          <Icon className={`w-4 h-4 ${data.weatherCode === 0 && data.isDay ? "text-amber-500" : "text-sky-500"}`} />
          <div className="flex items-center gap-1.5 border-l border-border/50 pl-2 ml-1">
            <MapPinIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">BLR</span>
          </div>
          <span className="font-bold ml-1 text-foreground">{data.temperature}°C</span>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent align="end" className="w-72 p-0 overflow-hidden border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
        {/* Header section with gradient */}
        <div className="p-4 bg-gradient-to-br from-primary/10 via-transparent to-transparent flex items-start justify-between">
          <div>
            <h4 className="font-black text-xl tracking-tight text-foreground">{data.temperature}°C</h4>
            <p className="text-sm font-semibold text-muted-foreground mt-0.5">{desc}</p>
          </div>
          <Icon className={`w-10 h-10 ${data.weatherCode === 0 && data.isDay ? "text-amber-500" : "text-sky-500"} drop-shadow-lg`} />
        </div>
        
        {/* Location row */}
        <div className="px-4 py-2 border-y border-border/40 bg-muted/30 flex items-center gap-2 text-xs">
          <MapPinIcon className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">Bangalore, Karnataka</span>
        </div>

        {/* Detailed stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border/40">
          <div className="bg-background p-4 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors">
            <DropletsIcon className="w-5 h-5 mb-2 text-blue-500" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Humidity</span>
            <span className="text-sm font-bold text-foreground">{data.humidity}%</span>
          </div>
          <div className="bg-background p-4 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors">
            <WindIcon className="w-5 h-5 mb-2 text-teal-500" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Wind</span>
            <span className="text-sm font-bold text-foreground">{data.windSpeed} km/h</span>
          </div>
        </div>
        
        {/* AQI Footer */}
        <div className={`p-4 flex items-center justify-between ${aqiInfo.bg} border-t border-border/40`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md bg-background/80 shadow-sm ${aqiInfo.color}`}>
              <LeafIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mix-blend-luminosity">Air Quality (AQI)</span>
              <span className={`text-sm font-bold ${aqiInfo.color}`}>{aqiInfo.label}</span>
            </div>
          </div>
          <span className={`text-lg font-black ${aqiInfo.color}`}>{data.aqi}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
