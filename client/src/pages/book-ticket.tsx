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
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-chart-2/10 mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-chart-2" />
            </div>
            <div>
              <h2 className="text-xl font-bold" data-testid="text-booking-success">Ticket Booked!</h2>
              <p className="text-sm text-muted-foreground">Show this QR code at the metro gate</p>
            </div>
          </div>

          <Card data-testid="card-ticket-details" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-primary px-5 py-4">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <TrainFrontIcon className="w-5 h-5 text-primary-foreground" />
                    <span className="text-sm font-bold text-primary-foreground">SmartAI Metro</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {bookedTicket.passengers} passenger{bookedTicket.passengers > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              <div className="px-5 py-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <CircleDotIcon className="w-4 h-4 text-chart-2" />
                    <div className="w-0.5 h-8 bg-border" />
                    {bookedTicket.hasTransfer && (
                      <>
                        <ArrowUpDownIcon className="w-3.5 h-3.5 text-chart-4" />
                        <div className="w-0.5 h-8 bg-border" />
                      </>
                    )}
                    <MapPinIcon className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">From</p>
                      <p className="text-sm font-semibold" data-testid="text-ticket-source">
                        {bookedTicket.sourceName}
                        {bookedTicket.sourcePlatform && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">Platform {bookedTicket.sourcePlatform}</span>
                        )}
                      </p>
                    </div>
                    {bookedTicket.hasTransfer && bookedTicket.transferStation && (
                      <div className="p-2 rounded-md bg-chart-4/5 border border-chart-4/15" data-testid="text-ticket-transfer">
                        <p className="text-[10px] text-chart-4 uppercase tracking-wider font-semibold">Platform Change at</p>
                        <p className="text-xs font-semibold mt-0.5">{bookedTicket.transferStation}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Platform {bookedTicket.transferFromPlatform} → Platform {bookedTicket.transferToPlatform}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">To</p>
                      <p className="text-sm font-semibold" data-testid="text-ticket-dest">
                        {bookedTicket.destName}
                        {bookedTicket.destPlatform && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">Platform {bookedTicket.destPlatform}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ticket ID</p>
                      <p className="font-mono text-xs font-semibold mt-0.5">{bookedTicket.id.slice(0, 12)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Fare</p>
                      <p className="font-bold text-primary mt-0.5">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(bookedTicket.totalFare)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Passengers</p>
                      <p className="text-sm font-semibold mt-0.5">{bookedTicket.passengers}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                      <Badge variant="default" className="text-[10px] mt-0.5">{bookedTicket.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed pt-4 flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground font-medium">Scan QR at Metro Gate</p>
                  <div className="p-2 bg-white rounded-lg">
                    <img
                      src={qrDataUrl}
                      alt="Ticket QR Code"
                      className="w-44 h-44"
                      data-testid="img-qr-code"
                    />
                  </div>
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
              Book Another
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
              Save QR
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
              Book Metro Ticket
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-powered dynamic pricing for Bangalore Metro
            </p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Wallet</p>
              <p className="text-sm font-bold text-primary">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user.walletBalance)}
              </p>
            </div>
          )}
        </div>

        <Card data-testid="card-station-select">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <CircleDotIcon className="w-3 h-3 text-chart-2" />
                From
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger data-testid="select-source-station" className="h-11">
                  <SelectValue placeholder="Select departure station" />
                </SelectTrigger>
                <SelectContent>
                  {purpleStations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7B2D8E" }} />
                        Purple Line
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
                        Green Line
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
                To
              </Label>
              <Select value={destId} onValueChange={setDestId}>
                <SelectTrigger data-testid="select-dest-station" className="h-11">
                  <SelectValue placeholder="Select arrival station" />
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

        <Card data-testid="card-passengers">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Passengers</span>
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
                  onClick={() => setPassengers(Math.min(6, passengers + 1))}
                  disabled={passengers >= 6}
                  data-testid="button-passenger-plus"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {pricing && (
          <Card data-testid="card-pricing-info" className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary" />
                AI Dynamic Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {passengers > 1 ? `${passengers} passengers` : "Per person"}
                  </p>
                  {passengers > 1 && (
                    <p className="text-[11px] text-muted-foreground">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(pricing.dynamicFare)} each
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary" data-testid="text-total-fare">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalFare)}
                  </p>
                  <Badge
                    variant={pricing.demandLevel === "high" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {pricing.demandLevel} demand
                  </Badge>
                </div>
              </div>

              {pricing.multiplier > 1 && (
                <div className="p-2.5 rounded-lg bg-chart-4/5 border border-chart-4/15">
                  <p className="text-xs text-chart-4 flex items-center gap-1.5">
                    <SparklesIcon className="w-3 h-3 flex-shrink-0" />
                    Surge pricing: {((pricing.multiplier - 1) * 100).toFixed(0)}% increase due to {pricing.demandLevel} demand
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
                  Proceed to Payment
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {showPayment && (
          <Card data-testid="card-payment">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "wallet", label: "Wallet", icon: WalletIcon, subtitle: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user?.walletBalance ?? 0) },
                  { id: "upi", label: "UPI", icon: CreditCardIcon, subtitle: "Pay via UPI" },
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
                  <Label className="text-xs font-medium">UPI ID</Label>
                  <Input
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    data-testid="input-upi-id"
                  />
                </div>
              )}

              {paymentMethod === "wallet" && user && totalFare > user.walletBalance && (
                <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
                  <p className="text-xs text-destructive">
                    Insufficient balance. You need {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalFare - user.walletBalance)} more.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
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
                  "Processing..."
                ) : (
                  <>
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    Pay & Generate Ticket
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
