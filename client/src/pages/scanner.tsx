import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ScanLineIcon, CheckCircleIcon, XCircleIcon, ShieldAlertIcon, RefreshCcwIcon,
  TrainFrontIcon, UsersIcon, IndianRupeeIcon, AlertCircleIcon, Loader2Icon,
  ArrowRightToLineIcon, ArrowLeftFromLineIcon, Settings2Icon,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/components/language-provider";

type ScanResult = {
  valid: boolean;
  fraudDetected: boolean;
  fraudReason?: string;
  message: string;
  ticket?: {
    id: string;
    sourceName: string;
    destName: string;
    totalFare: number;
    passengers: number;
    status: string;
    entryCount?: number;
    exitCount?: number;
  };
};

// Payment-style ascending 3-note chime (G5 → B5 → E6), like Google Pay / Apple Pay
const playSuccessSound = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [783.99, 987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {}
};

// Harsh descending buzz for error/fraud
const playErrorSound = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch {}
};

export default function ScannerPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [manualTicket, setManualTicket] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"auto" | "entry" | "exit">("auto");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "scanner") setLocation("/");
  }, [user, setLocation]);

  const scanMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const payload: any = { ticketId };
      if (scanMode !== "auto") payload.scanType = scanMode;
      const res = await apiRequest("POST", "/api/scan", payload);
      return await res.json() as ScanResult;
    },
    onSuccess: (data) => {
      setLastResult(data);
      if (data.valid && !data.fraudDetected) playSuccessSound();
      else playErrorSound();
    },
    onError: (error: any) => {
      playErrorSound();
      setLastResult({ valid: false, fraudDetected: false, message: error.message || "Failed to scan ticket" });
    },
  });

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); } catch {}
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    setLastResult(null);
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current = new Html5Qrcode("reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) {
        toast({ title: "No Camera", description: "No camera detected. Use manual entry.", variant: "destructive" });
        return;
      }

      // Prefer back/environment camera
      await new Promise(resolve => setTimeout(resolve, 500));

      const backCamera = cameras.find(c => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];

      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 30,           // 30fps is more stable across devices
          aspectRatio: 1.0,
          // No qrbox — decodes from full camera frame, fastest possible
          disableFlip: false,
        },
        (decodedText) => {
          stopScanner();
          try {
            const payload = JSON.parse(decodedText);
            if (payload.ticketId) {
              scanMutation.mutate(payload.ticketId);
            } else {
              playErrorSound();
              toast({ title: "Invalid QR", description: "Not a SmartAI Metro ticket QR.", variant: "destructive" });
            }
          } catch {
            playErrorSound();
            toast({ title: "Invalid QR", description: "Could not read QR code data.", variant: "destructive" });
          }
        },
        undefined
      );
      setIsScanning(true);
    } catch (err: any) {
      toast({ title: "Camera Error", description: err?.message ?? "Check camera permissions.", variant: "destructive" });
    }
  };

  const verifyManual = () => {
    const id = manualTicket.trim();
    if (id.length < 5) {
      toast({ title: "Too Short", description: "Enter at least 5 characters.", variant: "destructive" });
      return;
    }
    setLastResult(null);
    scanMutation.mutate(id);
  };

  useEffect(() => {
    return () => { scannerRef.current?.isScanning && scannerRef.current.stop().catch(() => {}); };
  }, []);

  if (!user || (user.role !== "admin" && user.role !== "scanner")) return null;

  const isValid = lastResult?.valid && !lastResult?.fraudDetected;
  const isFraud = lastResult?.fraudDetected;

  // Calculate remaining
  const passengers = lastResult?.ticket?.passengers ?? 1;
  const entries = lastResult?.ticket?.entryCount ?? 0;
  const exits = lastResult?.ticket?.exitCount ?? 0;
  const remaining = entries < passengers ? (passengers - entries) : (passengers - exits);

  return (
    <div className="container max-w-lg mx-auto py-8 px-4 space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScanLineIcon className="w-8 h-8 text-primary" />
          {t("scanner.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("scanner.subtitle")}</p>
      </div>

      {/* Mode Selector */}
      <Card className="glass-card border-0">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Settings2Icon className="w-4 h-4 text-muted-foreground" />
              Scanner Mode
            </span>
            <ToggleGroup 
              type="single" 
              value={scanMode} 
              onValueChange={(val) => val && setScanMode(val as any)}
              className="justify-start sm:justify-end border rounded-md p-1"
            >
              <ToggleGroupItem value="auto" aria-label="Auto detect mode" className="text-xs px-3 h-8">
                Auto
              </ToggleGroupItem>
              <ToggleGroupItem value="entry" aria-label="Entry Gate mode" className="text-xs px-3 h-8 gap-1.5">
                <ArrowRightToLineIcon className="w-3.5 h-3.5" />
                Entry
              </ToggleGroupItem>
              <ToggleGroupItem value="exit" aria-label="Exit Gate mode" className="text-xs px-3 h-8 gap-1.5">
                <ArrowLeftFromLineIcon className="w-3.5 h-3.5" />
                Exit
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Camera */}
      <Card className="glass-card border-0 overflow-hidden">
        <div className="bg-muted px-4 py-3 flex justify-between items-center text-sm border-b">
          <span className="font-semibold">{t("scanner.cameraScanner")}</span>
          <span className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isScanning ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
            <span className="text-xs text-muted-foreground">{isScanning ? t("scanner.scanning") : t("scanner.offline")}</span>
          </span>
        </div>
        <CardContent className="p-0">
          <div className="relative w-full bg-black" style={{ minHeight: 280 }}>
            <div id="reader" className="w-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white p-6 text-center">
                <div className="w-20 h-20 rounded-2xl border-2 border-white/30 flex items-center justify-center">
                  <ScanLineIcon className="w-10 h-10 opacity-40" />
                </div>
                <p className="text-sm text-white/60">{t("scanner.pointCamera")}</p>
                <Button onClick={startScanner} size="lg" className="w-full max-w-xs">
                  {t("scanner.startCamera")}
                </Button>
              </div>
            )}
            {isScanning && scanMutation.isPending && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 text-white">
                <Loader2Icon className="w-10 h-10 animate-spin" />
                <p className="text-sm font-medium">{t("scanner.verifying")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual entry */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("scanner.manualVerification")}</CardTitle>
          <CardDescription>{t("scanner.manualDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder={t("scanner.placeholder")}
              value={manualTicket}
              onChange={e => setManualTicket(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verifyManual()}
              disabled={scanMutation.isPending}
            />
            <Button onClick={verifyManual} disabled={scanMutation.isPending} className="shrink-0">
              {scanMutation.isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : t("scanner.verify")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {lastResult && (
        <Card className={`glass-card transition-all duration-500 ${
          isFraud ? "border-destructive/50 shadow-[0_0_20px_rgba(255,0,0,0.3)] bg-destructive/10" :
          isValid ? "border-green-500/50 shadow-[0_0_20px_rgba(0,255,100,0.3)] bg-green-500/10" :
          "border-orange-400/50 shadow-[0_0_20px_rgba(255,165,0,0.3)] bg-orange-400/10"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              {isFraud
                ? <ShieldAlertIcon className="w-7 h-7 text-red-500" />
                : isValid
                ? <CheckCircleIcon className="w-7 h-7 text-green-500" />
                : <XCircleIcon className="w-7 h-7 text-orange-400" />}
              {isFraud ? `⚠️ ${t("scanner.fraudAlert")}` : isValid ? `✅ ${t("scanner.ticketValid")}` : `❌ ${t("scanner.invalidTicket")}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Countdown Badge */}
            {isValid && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center animate-in zoom-in-95 duration-300">
                <p className="text-primary font-bold text-4xl leading-tight">{remaining}</p>
                <p className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">
                  {remaining === 1 ? t("scanner.passengerRemaining") : t("scanner.passengersRemaining")}
                </p>
              </div>
            )}
            {/* Status message */}
            <div className={`flex items-start gap-2 p-3 rounded-md text-sm font-medium ${
              isFraud ? "bg-red-500/10 text-red-700" :
              isValid ? "bg-green-500/10 text-green-700" :
              "bg-orange-400/10 text-orange-700"
            }`}>
              <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{lastResult.message}</span>
            </div>

            {/* Fraud reason */}
            {isFraud && lastResult.fraudReason && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                <ShieldAlertIcon className="w-4 h-4 mt-0.5 shrink-0" />
                <span><strong>{t("scanner.fraudReasonLabel")}:</strong> {lastResult.fraudReason}</span>
              </div>
            )}

            {/* Ticket info */}
            {lastResult.ticket && (
              <div className="rounded-lg border bg-background divide-y text-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3">
                  <TrainFrontIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{t("scanner.route")}</span>
                  <span className="ml-auto font-semibold text-right">
                    {lastResult.ticket.sourceName} → {lastResult.ticket.destName}
                  </span>
                </div>

                {/* Passenger progress tracker */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UsersIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{t("scanner.passengers")}</span>
                    <span className="ml-auto font-semibold">{lastResult.ticket.passengers} {t("scanner.total")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">Entry</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: lastResult.ticket.passengers }).map((_, i) => (
                          <div
                            key={i}
                            title={i < (lastResult.ticket?.entryCount ?? 0) ? `${t("scanner.passengerRemaining")} ${i + 1} ${t("scanner.entry")}` : t("scanner.pending")}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                              i < (lastResult.ticket?.entryCount ?? 0)
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-background border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">Exit</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: lastResult.ticket.passengers }).map((_, i) => (
                          <div
                            key={i}
                            title={i < (lastResult.ticket?.exitCount ?? 0) ? `${t("scanner.passengerRemaining")} ${i + 1} ${t("scanner.exit")}` : t("scanner.pending")}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                              i < (lastResult.ticket?.exitCount ?? 0)
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "bg-background border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3">
                  <IndianRupeeIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{t("scanner.farePaid")}</span>
                  <span className="ml-auto font-semibold">₹{lastResult.ticket.totalFare.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <ScanLineIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{t("scanner.ticketStatus")}</span>
                  <span className={`ml-auto font-bold capitalize ${
                    lastResult.ticket.status === "active" ? "text-green-600" :
                    lastResult.ticket.status === "used" ? "text-slate-500" : "text-red-500"
                  }`}>{lastResult.ticket.status}</span>
                </div>
                <div className="px-4 py-2.5">
                  <p className="text-[11px] font-mono text-muted-foreground truncate">ID: {lastResult.ticket.id}</p>
                </div>
              </div>
            )}

            <Button onClick={startScanner} className="w-full" variant="outline">
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              {t("scanner.scanNext")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
