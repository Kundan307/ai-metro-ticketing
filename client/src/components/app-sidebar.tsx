
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import {
  TicketIcon,
  MapIcon,
  TrainFrontIcon,
  ClockIcon,
  UsersIcon,
  SparklesIcon,
  NavigationIcon,
  WalletIcon,
  LogOutIcon,
  HistoryIcon,
  ChevronRightIcon,
  SettingsIcon,
  Accessibility,
  ShieldCheckIcon, // Added
  ScanLineIcon, // Added
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/components/language-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";

const mainItems = [
  { titleKey: "sidebar.bookTicket", url: "/", icon: TicketIcon },
  { titleKey: "sidebar.myTickets", url: "/tickets", icon: HistoryIcon },
  { titleKey: "sidebar.wallet", url: "/wallet", icon: WalletIcon },
];

const exploreItems = [
  { titleKey: "sidebar.routePlanner", url: "/planner", icon: NavigationIcon },
  { titleKey: "sidebar.metroMap", url: "/map", icon: MapIcon },
  { titleKey: "sidebar.trainSchedule", url: "/schedule", icon: ClockIcon },
  { titleKey: "sidebar.crowdInfo", url: "/crowd", icon: UsersIcon },
  { titleKey: "sidebar.aiInsights", url: "/insights", icon: SparklesIcon },
  { titleKey: "sidebar.accessibility", url: "/accessibility", icon: Accessibility },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <Sidebar className="border-r border-white/5 bg-background/80 backdrop-blur-xl">
      <SidebarHeader className="p-6 pb-4">
        <Link href="/" data-testid="link-home-logo">
          <div className="flex items-center gap-3 active:scale-95 transition-transform group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-premium-gradient shadow-glow-primary group-hover:shadow-glow-accent transition-all duration-500">
              <TrainFrontIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-md font-black tracking-tight leading-none text-foreground group-hover:text-primary transition-colors">{t("app.title")}</span>
              <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest mt-1.5">{t("app.subtitle")}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        {user && user.role === "user" && (
          <div className="px-2 py-4">
            <Link href="/wallet">
              <div className="p-4 rounded-2xl glass-card transition-all hover:bg-white/5 hover:border-primary/30 hover:-translate-y-1 hover:shadow-glow-primary active:scale-[0.98] group cursor-pointer" data-testid="card-sidebar-profile">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-premium-gradient flex items-center justify-center flex-shrink-0 shadow-glow-primary group-hover:shadow-glow-accent transition-all duration-300">
                    <span className="text-xs font-black text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors" data-testid="text-user-name">{user.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <WalletIcon className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs font-black text-accent drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" data-testid="text-sidebar-balance">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user.walletBalance)}
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.quickActions")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.role === "user" && mainItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                  >
                    <Link href={item.url}>
                      <a data-testid={`link-nav-${item.titleKey}`} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.titleKey)}</span>
                      </a>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {(user?.role === "admin" || user?.role === "scanner") && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-active={location === "/scanner"}>
                    <Link href="/scanner">
                      <a data-testid="link-nav-scanner" className="flex items-center gap-2">
                        <ScanLineIcon className="w-4 h-4" />
                        <span>{t("sidebar.qrScanner")}</span>
                      </a>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-active={location === "/admin"}>
                    <Link href="/admin">
                      <a data-testid="link-nav-admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:shadow-glow-primary">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span className="font-semibold">{t("sidebar.adminDashboard")}</span>
                      </a>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.role === "user" && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("sidebar.explore")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {exploreItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url}
                    >
                      <Link href={item.url}>
                        <a data-testid={`link-nav-${item.titleKey}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:shadow-glow-primary">
                           <item.icon className="w-5 h-5" />
                           <span className="font-semibold">{t(item.titleKey)}</span>
                        </a>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-active={location === "/settings"}>
              <Link href="/settings">
                <a data-testid="link-nav-settings" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  <span>{t("sidebar.accountSettings")}</span>
                </a>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm text-muted-foreground"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          {t("sidebar.signOut")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
