import { useEffect, useState } from "react";
import { CloudIcon, SunIcon, CloudRainIcon, CloudLightningIcon, Loader2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

// Map WMO weather codes to icons and descriptions
const getWeatherInfo = (code: number, isDay: boolean) => {
  if (code === 0) return { icon: SunIcon, desc: "Clear" };
  if (code >= 1 && code <= 3) return { icon: CloudIcon, desc: "Partly Cloudy" };
  if (code >= 51 && code <= 67) return { icon: CloudRainIcon, desc: "Rain" };
  if (code >= 71 && code <= 82) return { icon: CloudRainIcon, desc: "Snow/Showers" };
  if (code >= 95) return { icon: CloudLightningIcon, desc: "Thunderstorm" };
  return { icon: CloudIcon, desc: "Cloudy" };
};

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch weather for Bangalore (approx lat: 12.97, lon: 77.59) from Open-Meteo (No API Key required)
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current_weather=true");
        if (res.ok) {
          const json = await res.json();
          setData({
            temperature: Math.round(json.current_weather.temperature),
            weatherCode: json.current_weather.weathercode,
            isDay: json.current_weather.is_day === 1,
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
        <span>Weather...</span>
      </div>
    );
  }

  if (!data) return null;

  const { icon: Icon, desc } = getWeatherInfo(data.weatherCode, data.isDay);

  return (
    <div 
      className="flex items-center gap-2 text-sm font-medium bg-muted/40 hover:bg-muted/60 transition-colors px-3 py-1.5 rounded-full border cursor-default"
      title={`Bangalore Weather: ${desc}`}
    >
      <Icon className={`w-4 h-4 ${data.weatherCode === 0 && data.isDay ? "text-amber-500" : "text-sky-500"}`} />
      <span>{data.temperature}°C</span>
    </div>
  );
}
