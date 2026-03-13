import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  TicketIcon,
  UsersIcon,
  CircleDotIcon,
  MapPinIcon,
  XCircleIcon,
  Loader2Icon,
  ArrowUpDownIcon,
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
          <Card>
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
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  onCancel,
  isCancelling,
}: {
  ticket: Ticket;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}) {
  const { t } = useTranslation();
  const statusColor = ticket.status === "active"
    ? "bg-chart-2"
    : ticket.status === "cancelled"
      ? "bg-destructive"
      : "bg-muted-foreground/30";

  return (
    <Card data-testid={`card-ticket-${ticket.id}`} className="overflow-hidden">
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
