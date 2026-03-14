import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type ScanLog } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheckIcon, AlertTriangleIcon, UserCheckIcon, ClockIcon, CheckCircleIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/language-provider";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: recentScans } = useQuery<ScanLog[]>({
    queryKey: ["/api/scans/recent"],
    enabled: user?.role === "admin",
    refetchInterval: 5000,
  });

  const { data: adminStats } = useQuery<{ totalBooked: number; currentlyInSystem: number; totalCompleted: number }>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
    refetchInterval: 5000,
  });

  const { data: usersData } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  const fraudScans = recentScans?.filter(scan => scan.fraudDetected) || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheckIcon className="w-8 h-8 text-primary" />
          {t("admin.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("admin.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-0 bg-primary/10 hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.totalBookings")}</CardTitle>
            <ClockIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{adminStats?.totalBooked || 0}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("admin.totalPassengersBooked")}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 bg-green-500/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t("admin.activeInMetro")}</CardTitle>
            <UserCheckIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{adminStats?.currentlyInSystem || 0}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("admin.passengersInside")}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 bg-blue-500/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">{t("admin.tripsCompleted")}</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adminStats?.totalCompleted || 0}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("admin.tripsFullyCompleted")}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0 bg-destructive/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">{t("admin.fraudAlerts")}</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{fraudScans.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t("admin.suspiciousActivities")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("admin.recentScanActivity")}</CardTitle>
          <CardDescription>{t("admin.realTimeFeed")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentScans?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent scans available.
              </div>
            ) : (
              recentScans?.map((scan) => (
                <div key={scan.id} className="flex items-center">
                  <div className={`mt-0.5 w-2 h-2 rounded-full mr-4 ${scan.fraudDetected ? 'bg-destructive' : 'bg-green-500'}`} />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                       Station ID {scan.stationId} • {scan.scanType === "entry" ? "🚪 Entry" : "🚶 Exit"}
                       {scan.fraudDetected && (
                         <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-sm font-semibold">
                            FRAUD
                         </span>
                       )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ticket: {scan.ticketId.split("-")[0]}...
                      {scan.fraudDetected && ` • Reason: ${scan.fraudReason}`}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(scan.scannedAt), "HH:mm:ss")}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>{t("admin.registeredUsers")} ({usersData?.length || 0})</CardTitle>
          <CardDescription>{t("admin.viewPassengersStaff")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">{t("admin.id")}</th>
                  <th className="px-4 py-3">{t("admin.name")}</th>
                  <th className="px-4 py-3">{t("admin.role")}</th>
                  <th className="px-4 py-3">{t("admin.email")}</th>
                  <th className="px-4 py-3 rounded-tr-md">{t("admin.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-muted-foreground">#{u.id}</td>
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 
                        u.role === 'scanner' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-zinc-500/10 text-zinc-500'
                      }`}>
                         {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM dd, yyyy")}
                    </td>
                  </tr>
                ))}
                {!usersData && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">{t("admin.loadingUsers")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
