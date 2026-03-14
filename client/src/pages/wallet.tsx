import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/components/language-provider";
import {
  WalletIcon,
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  IndianRupeeIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { WalletTransaction } from "@shared/schema";

export default function Wallet() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState("");

  const { data: transactions, isLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wallet/topup", {
        amount: parseFloat(topUpAmount),
      });
      return res.json();
    },
    onSuccess: () => {
      setTopUpAmount("");
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      toast({ title: t("wallet.topUpSuccess"), description: `${t("wallet.topUpAdded")}: ${topUpAmount}` });
    },
    onError: (error: Error) => {
      toast({ title: t("wallet.topUpFailed"), description: error.message, variant: "destructive" });
    },
  });

  const quickAmounts = [100, 200, 500, 1000];

  const totalSpent = transactions
    ?.filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-wallet-title">{t("wallet.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="glass-card relative overflow-hidden text-white border-0 hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1" data-testid="card-wallet-balance">
            <div className="absolute inset-0 bg-premium-gradient opacity-90" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs opacity-70">{t("wallet.availableBalance")}</p>
                  <p className="text-2xl font-bold" data-testid="text-balance">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user?.walletBalance ?? 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-total-spent" className="glass-card border-0 hover:shadow-glow-accent transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("wallet.totalSpent")}</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalSpent)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <TrendingUpIcon className="w-5 h-5 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-topup" className="glass-card border-0 hover:shadow-glow-primary transition-all duration-300 mb-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              {t("wallet.addMoney")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={topUpAmount === String(amt) ? "default" : "outline"}
                  onClick={() => setTopUpAmount(String(amt))}
                  className="text-sm"
                  data-testid={`button-quick-${amt}`}
                >
                  <IndianRupeeIcon className="w-3 h-3 mr-0.5" />
                  {amt}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("wallet.customAmount")}</Label>
              <Input
                type="number"
                placeholder={t("wallet.enterAmount")}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min={50}
                max={10000}
                data-testid="input-topup-amount"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => topUpMutation.mutate()}
              disabled={topUpMutation.isPending || !topUpAmount || parseFloat(topUpAmount) < 50}
              data-testid="button-topup-submit"
            >
              {topUpMutation.isPending ? t("bookTicket.processing") : t("wallet.addMoneyBtn")}
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-transactions" className="glass-card border-0 hover:shadow-glow-primary transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{t("wallet.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : !transactions?.length ? (
              <div className="py-8 text-center">
                <WalletIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-transactions">
                  {t("wallet.noTransactions")}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    data-testid={`row-transaction-${txn.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        txn.type === "credit" ? "bg-chart-2/10" : "bg-destructive/10"
                      }`}>
                        {txn.type === "credit" ? (
                          <ArrowDownLeftIcon className="w-4 h-4 text-chart-2" />
                        ) : (
                          <ArrowUpRightIcon className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{txn.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${
                      txn.type === "credit" ? "text-chart-2" : "text-destructive"
                    }`}>
                      {txn.type === "credit" ? "+" : ""}
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
