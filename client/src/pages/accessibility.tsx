import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accessibility,
  CheckCircle2,
  Phone,
  Volume2,
  ArrowUpFromDot,
  Waypoints,
  Eye,
} from "lucide-react";
import { PURPLE_LINE_STATIONS, GREEN_LINE_STATIONS } from "@/lib/metro-data";
import { useTranslation } from "@/components/language-provider";

const ACCESSIBILITY_KEY = "accessibility-mode";

interface StationAccessibility {
  name: string;
  line: string;
  elevator: boolean;
  wheelchairRamp: boolean;
  tactilePath: boolean;
}

function buildAccessibilityData(): StationAccessibility[] {
  const all = [
    ...PURPLE_LINE_STATIONS.map((s) => ({ name: s.name, line: s.line })),
    ...GREEN_LINE_STATIONS.map((s) => ({ name: s.name, line: s.line })),
  ];
  const seen = new Set<string>();
  const unique: StationAccessibility[] = [];
  for (const s of all) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      unique.push({
        name: s.name,
        line: s.line,
        elevator: true,
        wheelchairRamp: true,
        tactilePath: true,
      });
    }
  }
  return unique;
}

const emergencyContacts = [
  { label: "BMRCL Helpline", number: "080-22969222" },
  { label: "Metro Control Room", number: "080-22969333" },
  { label: "Police (Emergency)", number: "112" },
  { label: "Ambulance", number: "108" },
];

const routeTips = [
  "All Bangalore Metro stations have platform screen doors for safety.",
  "Wheelchair-accessible coaches are available in the first and last compartments of every train.",
  "Request assistance at the station help desk for boarding and alighting.",
  "Lifts are available at every station entrance and platform level.",
  "Priority seating is reserved near the doors in every coach.",
  "Companion travel is free for persons with disabilities on BMRCL.",
];

export default function AccessibilityPage() {
  const { t } = useTranslation();
  const [accessibilityMode, setAccessibilityMode] = useState(() => {
    return localStorage.getItem(ACCESSIBILITY_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(ACCESSIBILITY_KEY, String(accessibilityMode));
    if (accessibilityMode) {
      document.documentElement.classList.add("accessibility-mode");
    } else {
      document.documentElement.classList.remove("accessibility-mode");
    }
  }, [accessibilityMode]);

  useEffect(() => {
    return () => {
      if (!localStorage.getItem(ACCESSIBILITY_KEY) || localStorage.getItem(ACCESSIBILITY_KEY) !== "true") {
        document.documentElement.classList.remove("accessibility-mode");
      }
    };
  }, []);

  const stations = buildAccessibilityData();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Accessibility className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">{t("accessibility.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("accessibility.subtitle")}</p>
          </div>
        </div>

        <Card data-testid="card-accessibility-toggle">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Accessibility Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="accessibility-toggle"
                checked={accessibilityMode}
                onCheckedChange={setAccessibilityMode}
                data-testid="switch-accessibility-mode"
              />
              <Label htmlFor="accessibility-toggle" className="text-sm" data-testid="text-accessibility-status">
                {accessibilityMode ? "Enabled — larger text and higher contrast" : "Disabled — standard display"}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Increases font sizes and contrast across the application for improved readability.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-station-accessibility">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpFromDot className="w-4 h-4" />
              Station Accessibility Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-station-accessibility">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Station</th>
                    <th className="text-left py-2 pr-4 font-medium">Line</th>
                    <th className="text-center py-2 px-2 font-medium">Elevator</th>
                    <th className="text-center py-2 px-2 font-medium">Wheelchair Ramp</th>
                    <th className="text-center py-2 px-2 font-medium">Tactile Path</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station, idx) => (
                    <tr key={station.name} className="border-b last:border-0" data-testid={`row-station-${idx}`}>
                      <td className="py-2 pr-4 font-medium">{station.name}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {station.line}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2">
                        {station.elevator && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto" />}
                      </td>
                      <td className="text-center py-2 px-2">
                        {station.wheelchairRamp && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto" />}
                      </td>
                      <td className="text-center py-2 px-2">
                        {station.tactilePath && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card data-testid="card-route-tips">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Waypoints className="w-4 h-4" />
                Wheelchair-Friendly Route Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {routeTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-route-tip-${idx}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card data-testid="card-emergency-contacts">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {emergencyContacts.map((contact, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2 text-sm" data-testid={`text-contact-${idx}`}>
                      <span className="text-muted-foreground">{contact.label}</span>
                      <span className="font-mono font-semibold">{contact.number}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-audio-assistance">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio Assistance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All Bangalore Metro stations and trains are equipped with a Public Address (PA) system.
                  Announcements are made in Kannada, Hindi, and English for upcoming stations, doors opening/closing,
                  and emergency information. Visually impaired passengers can request additional audio guidance
                  from the station help desk.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
