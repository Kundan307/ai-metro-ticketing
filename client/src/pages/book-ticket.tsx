import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/components/language-provider";
import {
  CreditCardIcon,
  WalletIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrainFrontIcon,
  CheckCircleIcon,
  ArrowUpDownIcon,
  UsersIcon,
  MinusIcon,
  PlusIcon,
  MapPinIcon,
  CircleDotIcon,
  DownloadIcon,
} from "lucide-react";
import type { Station, Ticket } from "@shared/schema";

export default function BookTicket() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState<string>("");
  const [destId, setDestId] = useState<string>("");
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const [upiId, setUpiId] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [bookedTicket, setBookedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  const { data: pricing } = useQuery<{
    baseFare: number;
    dynamicFare: number;
    multiplier: number;
    demandLevel: string;
    recommendation: string;
  }>({
    queryKey: ["/api/pricing", sourceId, destId],
    enabled: !!sourceId && !!destId && sourceId !== destId,
  });

  const totalFare = pricing ? pricing.dynamicFare * passengers : 0;

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tickets", {
        sourceStationId: parseInt(sourceId),
        destStationId: parseInt(destId),
        passengers,
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
      });
      return res.json();
    },
    onSuccess: (data: { ticket: Ticket; qrDataUrl: string }) => {
      setBookedTicket(data.ticket);
      setQrDataUrl(data.qrDataUrl);
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      toast({
        title: "Ticket Booked!",
        description: `${passengers} ticket${passengers > 1 ? "s" : ""} for ${data.ticket.sourceName} → ${data.ticket.destName}`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
    },
  });

  const swapStations = () => {
    const temp = sourceId;
    setSourceId(destId);
    setDestId(temp);
  };

  const purpleStations = stations?.filter((s) => s.line === "purple") ?? [];
  const greenStations = stations?.filter((s) => s.line === "green") ?? [];

  if (bookedTicket && qrDataUrl) {
    return (
      <div className="p-4 md:p-6 overflow-y-auto h-full">
        <div className="max-w-md mx-auto space-y-6 py-4">
          <div className="text-center space-y-4 animate-scale-in">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 mx-auto shadow-inner">
              <CheckCircleIcon className="w-10 h-10 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" data-testid="text-booking-success">
                {t("ticket.booked")}
              </h2>
              <p className="text-sm text-muted-foreground/80 mt-1">{t("ticket.showQR")}</p>
            </div>
          </div>

          <Card data-testid="card-ticket-details" className="overflow-hidden border-0 shadow-2xl shadow-primary/10">
            <CardContent className="p-0">
              <div className="bg-primary px-6 py-6 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full -ml-12 -mb-12 blur-xl" />
                
                <div className="flex items-center justify-between gap-1 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                      <TrainFrontIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-md font-bold text-white block leading-none">{t("ticket.smartAIMetro")}</span>
                      <span className="text-[10px] text-white/60 uppercase tracking-widest mt-1 block">Bangalore Metro</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1 text-[11px] font-bold">
                    {bookedTicket.passengers} {bookedTicket.passengers > 1 ? t("ticket.passengersMultiple") : t("ticket.passenger")}
                  </Badge>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6 bg-card/80 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.5)]" />
                    <div className="w-0.5 h-12 bg-gradient-to-b from-secondary to-destructive opacity-20" />
                    <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.5)]" />
                  </div>
                  <div className="flex-1 space-y-5">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{t("ticket.from")}</p>
                      <p className="text-lg font-bold mt-0.5" data-testid="text-ticket-source">
                        {bookedTicket.sourceName}
                      </p>
                      {bookedTicket.sourcePlatform && (
                         <div className="flex items-center gap-1.5 mt-1">
                           <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">{t("ticket.platform")} {bookedTicket.sourcePlatform}</span>
                         </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{t("ticket.to")}</p>
                      <p className="text-lg font-bold mt-0.5" data-testid="text-ticket-dest">
                        {bookedTicket.destName}
                      </p>
                      {bookedTicket.destPlatform && (
                         <div className="flex items-center gap-1.5 mt-1">
                           <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">{t("ticket.platform")} {bookedTicket.destPlatform}</span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-border/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ticket ID</p>
                    <p className="font-mono text-xs font-bold mt-1 text-primary">{bookedTicket.id.slice(0, 12)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("ticket.totalFare")}</p>
                    <p className="text-lg font-black text-secondary mt-0.5">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(bookedTicket.totalFare)}
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex flex-col items-center gap-4 bg-muted/30 rounded-2xl p-4">
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <img
                      src={qrDataUrl}
                      alt="Ticket QR Code"
                      className="w-48 h-48"
                      data-testid="img-qr-code"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t("ticket.scanQR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => {
                setBookedTicket(null);
                setQrDataUrl("");
                setSourceId("");
                setDestId("");
                setPassengers(1);
                setShowPayment(false);
                setUpiId("");
              }}
              data-testid="button-book-another"
            >
              {t("ticket.bookAnother")}
            </Button>
            <Button
              className="flex-1"
              variant="default"
              onClick={() => {
                const link = document.createElement("a");
                link.href = qrDataUrl;
                link.download = `metro-ticket-${bookedTicket.id.slice(0, 8)}.png`;
                link.click();
              }}
              data-testid="button-download-qr"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t("ticket.saveQR")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-book-title">
              {t("bookTicket.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("app.poweredBy")}
            </p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">{t("common.wallet")}</p>
              <p className="text-sm font-bold text-primary">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user.walletBalance)}
              </p>
            </div>
          )}
        </div>

        <Card data-testid="card-station-select" className="glass-card border-0 mb-2 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <CircleDotIcon className="w-3 h-3 text-chart-2" />
                {t("label.from")}
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger data-testid="select-source-station" className="h-11">
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
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-source-${s.id}`}>
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
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-source-${s.id}`}>
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
                data-testid="button-swap-stations"
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
                <SelectTrigger data-testid="select-dest-station" className="h-11">
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
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-dest-${s.id}`}>
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
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-dest-${s.id}`}>
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

        <Card data-testid="card-passengers" className="glass-card border-0 mb-2 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("bookTicket.passengers")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  disabled={passengers <= 1}
                  data-testid="button-passenger-minus"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xl font-bold w-6 text-center" data-testid="text-passenger-count">{passengers}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setPassengers(Math.min(12, passengers + 1))}
                  disabled={passengers >= 12}
                  data-testid="button-passenger-plus"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {pricing && (
          <Card data-testid="card-pricing-info" className="glass-card border-primary/20 mb-2 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary" />
                {t("app.aiPricing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {passengers > 1 ? `${passengers} ${t("bookTicket.passengers")}` : t("bookTicket.perPerson")}
                  </p>
                  {passengers > 1 && (
                    <p className="text-[11px] text-muted-foreground">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(pricing.dynamicFare)} {t("bookTicket.each")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {pricing.multiplier > 1 && (
                    <p className="text-xs text-muted-foreground line-through mb-0.5 mt-[-4px]">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(pricing.baseFare * passengers)}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-primary" data-testid="text-total-fare">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalFare)}
                  </p>
                  <Badge
                    variant={pricing.demandLevel === "high" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {pricing.demandLevel} {t("bookTicket.demand")}
                  </Badge>
                </div>
              </div>

              {pricing.multiplier > 1 && (
                <div className="p-2.5 rounded-lg bg-chart-4/5 border border-chart-4/15">
                  <p className="text-xs text-chart-4 flex items-center gap-1.5">
                    <SparklesIcon className="w-3 h-3 flex-shrink-0" />
                    {t("bookTicket.surgePricing")}: {((pricing.multiplier - 1) * 100).toFixed(0)}% {t("bookTicket.increaseDueTo")} {pricing.demandLevel} {t("bookTicket.demand")}
                  </p>
                </div>
              )}

              {pricing.recommendation && (
                <div className="p-2.5 rounded-lg bg-chart-2/5 border border-chart-2/15">
                  <p className="text-xs text-chart-2 flex items-center gap-1.5">
                    <SparklesIcon className="w-3 h-3 flex-shrink-0" />
                    {pricing.recommendation}
                  </p>
                </div>
              )}

              {!showPayment && (
                <Button
                  className="w-full"
                  onClick={() => setShowPayment(true)}
                  data-testid="button-proceed-payment"
                >
                  {t("bookTicket.proceedToPayment")}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {showPayment && (
          <Card data-testid="card-payment" className="glass-card border-0 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4" />
                {t("bookTicket.payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "wallet", label: t("common.wallet"), icon: WalletIcon, subtitle: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user?.walletBalance ?? 0) },
                  { id: "upi", label: t("bookTicket.upi"), icon: CreditCardIcon, subtitle: `Pay via ${t("bookTicket.upi")}` },
                ].map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method.id)}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    data-testid={`button-payment-${method.id}`}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{method.label}</span>
                    <span className="text-[10px] opacity-70">{method.subtitle}</span>
                  </Button>
                ))}
              </div>

              {paymentMethod === "upi" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t("bookTicket.upi")} ID</Label>
                  <Input
                    placeholder={t("bookTicket.upiPlaceholder")}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    data-testid="input-upi-id"
                  />
                </div>
              )}

              {paymentMethod === "wallet" && user && totalFare > user.walletBalance && (
                <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
                  <p className="text-xs text-destructive">
                    {t("bookTicket.insufficientBalance")}. You need {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalFare - user.walletBalance)} more.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("bookTicket.total")}</span>
                <span className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalFare)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => bookMutation.mutate()}
                disabled={
                  bookMutation.isPending ||
                  (paymentMethod === "upi" && !upiId) ||
                  (paymentMethod === "wallet" && (user?.walletBalance ?? 0) < totalFare)
                }
                data-testid="button-confirm-payment"
              >
                {bookMutation.isPending ? (
                  t("bookTicket.processing")
                ) : (
                  <>
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    {t("bookTicket.payAndGenerate")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
