import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TicketIcon,
  UsersIcon,
  CircleDotIcon,
  MapPinIcon,
  XCircleIcon,
  Loader2Icon,
  ArrowUpDownIcon,
  QrCodeIcon,
  CopyIcon,
  CheckIcon,
  IndianRupeeIcon,
  CalendarIcon,
  TrainFrontIcon,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useTranslation } from "@/components/language-provider";
import type { Ticket } from "@shared/schema";

export default function MyTickets() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/my"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      setCancellingId(ticketId);
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/cancel`);
      return res.json();
    },
    onSuccess: (data: { ticket: Ticket; refunded: boolean; refundAmount: number }) => {
      setCancellingId(null);
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      const desc = data.refunded
        ? `Refund of ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(data.refundAmount)} added to wallet.`
        : t("mytickets.cancelled");
      toast({ title: t("mytickets.cancelled"), description: desc });
    },
    onError: (error: Error) => {
      setCancellingId(null);
      toast({ title: t("mytickets.cancelFailed"), description: error.message, variant: "destructive" });
    },
  });

  const activeTickets = tickets?.filter((t) => t.status === "active") ?? [];
  const pastTickets = tickets?.filter((t) => t.status !== "active") ?? [];

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-mytickets-title">{t("mytickets.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {tickets?.length ? `${activeTickets.length} ${t("mytickets.active")}, ${pastTickets.length} ${t("mytickets.past")}` : t("mytickets.viewHistory")}
            </p>
          </div>
          <Link href="/">
            <Button variant="default" size="sm" data-testid="link-book-new">
              <TicketIcon className="w-3.5 h-3.5 mr-1.5" />
              {t("mytickets.bookNew")}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
        ) : !tickets?.length ? (
          <Card className="glass-card border-0">
            <CardContent className="py-12 text-center">
              <TicketIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground" data-testid="text-no-tickets">{t("mytickets.noTickets")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("mytickets.bookFirst")}</p>
              <Link href="/">
                <Button variant="default" size="sm" className="mt-4" data-testid="link-book-first">
                  {t("mytickets.bookATicket")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeTickets.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("mytickets.activeTickets")}</h2>
                <div className="space-y-3">
                  {activeTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onCancel={(id) => cancelMutation.mutate(id)}
                      isCancelling={cancellingId === ticket.id}
                      onSelect={(id) => setSelectedTicketId(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {pastTickets.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("mytickets.pastTickets")}</h2>
                <div className="space-y-3">
                  {pastTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} onSelect={(id) => setSelectedTicketId(id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}

function TicketCard({
  ticket,
  onCancel,
  isCancelling,
  onSelect,
}: {
  ticket: Ticket;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
  onSelect?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const statusColor = ticket.status === "active"
    ? "bg-chart-2"
    : ticket.status === "cancelled"
      ? "bg-destructive"
      : "bg-muted-foreground/30";

  return (
    <Card
      data-testid={`card-ticket-${ticket.id}`}
      className="glass-card border-0 overflow-hidden cursor-pointer hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1"
      onClick={() => onSelect?.(ticket.id)}
    >
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={`w-1 flex-shrink-0 ${statusColor}`} />
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CircleDotIcon className="w-3 h-3 text-chart-2 flex-shrink-0" />
                    <span className="font-semibold truncate">{ticket.sourceName}</span>
                    {ticket.sourcePlatform && (
                      <span className="text-[10px] text-muted-foreground">{t("ticket.platform")} {ticket.sourcePlatform}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">→</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPinIcon className="w-3 h-3 text-destructive flex-shrink-0" />
                    <span className="font-semibold truncate">{ticket.destName}</span>
                    {ticket.destPlatform && (
                      <span className="text-[10px] text-muted-foreground">{t("ticket.platform")} {ticket.destPlatform}</span>
                    )}
                  </div>
                </div>
                {ticket.hasTransfer && ticket.transferStation && (
                  <div className="flex items-center gap-1.5 text-[11px]" data-testid={`text-transfer-${ticket.id}`}>
                    <ArrowUpDownIcon className="w-3 h-3 text-chart-4 flex-shrink-0" />
                    <span className="text-chart-4 font-medium">
                      {t("ticket.platformChangeAt")} {ticket.transferStation} ({t("ticket.platform")} {ticket.transferFromPlatform} → {t("ticket.platform")} {ticket.transferToPlatform})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-mono">{ticket.id.slice(0, 8)}</span>
                  <span>
                    {new Date(ticket.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {ticket.passengers > 1 && (
                    <span className="flex items-center gap-0.5">
                      <UsersIcon className="w-3 h-3" />
                      {ticket.passengers} {ticket.passengers > 1 ? t("ticket.passengersMultiple") : t("ticket.passenger")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 space-y-1.5">
                <p className="text-sm font-bold text-primary">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(ticket.totalFare)}
                </p>
                <Badge
                  variant={ticket.status === "active" ? "default" : ticket.status === "cancelled" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {ticket.status}
                </Badge>
              </div>
            </div>

            {ticket.status === "active" && onCancel && (
              <div className="mt-3 pt-3 border-t border-dashed">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30"
                  onClick={() => onCancel(ticket.id)}
                  disabled={isCancelling}
                  data-testid={`button-cancel-ticket-${ticket.id}`}
                >
                  {isCancelling ? (
                    <>
                      <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      {t("mytickets.cancelling")}
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                      {t("mytickets.cancelBtn")}
                    </>
                  )}
                </Button>
                {ticket.paymentMethod === "wallet" && (
                  <span className="text-[10px] text-muted-foreground ml-2">{t("mytickets.fullRefund")}</span>
                )}
              </div>
            )}

            {ticket.status === "cancelled" && ticket.paymentMethod === "wallet" && (
              <div className="mt-2">
                <span className="text-[10px] text-muted-foreground">{t("mytickets.refundProcessed")}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketDetailDialog({
  ticketId,
  onClose,
}: {
  ticketId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ ticket: Ticket; qrDataUrl: string | null }>({
    queryKey: ["/api/tickets", ticketId, "detail"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tickets/${ticketId}/detail`);
      return res.json();
    },
    enabled: !!ticketId,
  });

  const ticket = data?.ticket;
  const qrDataUrl = data?.qrDataUrl;

  const handleCopyId = () => {
    if (ticket) {
      navigator.clipboard.writeText(ticket.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColor = ticket?.status === "active"
    ? "bg-green-500"
    : ticket?.status === "cancelled"
      ? "bg-destructive"
      : "bg-muted-foreground";

  return (
    <Dialog open={!!ticketId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <TicketIcon className="w-5 h-5 text-primary" />
              Ticket Details
            </DialogTitle>
          </DialogHeader>
        </div>

        {isLoading || !ticket ? (
          <div className="px-6 pb-6 space-y-4">
            <Skeleton className="h-48 w-48 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-5">
            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white rounded-xl border shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                    data-testid="img-ticket-qr"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Scan at metro gate</p>
              </div>
            )}

            {/* Ticket ID */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">ID:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded" data-testid="text-detail-ticket-id">
                {ticket.id}
              </code>
              <button
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-muted transition-colors"
                aria-label="Copy ticket ID"
              >
                {copied ? (
                  <CheckIcon className="w-3 h-3 text-green-500" />
                ) : (
                  <CopyIcon className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Route */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <CircleDotIcon className="w-4 h-4 text-green-500" />
                  <div className="w-px h-6 bg-border" />
                  <MapPinIcon className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{ticket.sourceName}</p>
                    {ticket.sourcePlatform && (
                      <p className="text-[10px] text-muted-foreground">Platform {ticket.sourcePlatform}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{ticket.destName}</p>
                    {ticket.destPlatform && (
                      <p className="text-[10px] text-muted-foreground">Platform {ticket.destPlatform}</p>
                    )}
                  </div>
                </div>
              </div>

              {ticket.hasTransfer && ticket.transferStation && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5">
                  <ArrowUpDownIcon className="w-3 h-3 flex-shrink-0" />
                  Transfer at {ticket.transferStation} (P{ticket.transferFromPlatform} → P{ticket.transferToPlatform})
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <UsersIcon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold">{ticket.passengers}</p>
                <p className="text-[10px] text-muted-foreground">Passengers</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <IndianRupeeIcon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-bold">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(ticket.totalFare)}
                </p>
                <p className="text-[10px] text-muted-foreground">Total Fare</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <TrainFrontIcon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                  <p className="text-sm font-bold capitalize">{ticket.status}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Status</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
              <div className="flex justify-between">
                <span>Booked</span>
                <span className="font-medium text-foreground">
                  {new Date(ticket.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="font-medium text-foreground uppercase">{ticket.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Demand</span>
                <Badge variant="outline" className="text-[10px] capitalize">{ticket.demandLevel}</Badge>
              </div>
              {ticket.passengers > 1 && (
                <div className="flex justify-between">
                  <span>Per Person</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(ticket.dynamicFare)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
