import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { LanguageProvider, useTranslation } from "@/components/language-provider";
import { type Language, languageNames } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, Loader2Icon, WalletIcon, TrainFrontIcon, GlobeIcon, BellIcon } from "lucide-react";
import { AIChatbot } from "@/components/ai-chatbot";
import { WeatherWidget } from "@/components/weather-widget";
import { Link } from "wouter";
import { io } from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import BookTicket from "@/pages/book-ticket";
import MyTickets from "@/pages/my-tickets";
import Wallet from "@/pages/wallet";
import MetroMap from "@/pages/metro-map";
import TrainSchedule from "@/pages/train-schedule";
import CrowdMonitor from "@/pages/crowd-monitor";
import AIInsights from "@/pages/ai-insights";
import AccountSettings from "@/pages/account-settings";
import RoutePlanner from "@/pages/route-planner";
import AccessibilityPage from "@/pages/accessibility";
import ScannerPage from "@/pages/scanner";
import AdminDashboard from "@/pages/admin-dashboard";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
    </Button>
  );
}

function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const languages: Language[] = ["en", "kn", "hi"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" data-testid="button-language-selector">
          <GlobeIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={language === lang ? "font-semibold" : ""}
            data-testid={`menu-item-language-${lang}`}
          >
            {languageNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Router() {
  const { user } = useAuth();
  return (
    <Switch>
      {(user?.role === "admin" || user?.role === "scanner") ? (
        <Route path="/" component={() => <Redirect to="/admin" />} />
      ) : (
        <Route path="/" component={BookTicket} />
      )}
      <Route path="/tickets" component={MyTickets} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/map" component={MetroMap} />
      <Route path="/schedule" component={TrainSchedule} />
      <Route path="/crowd" component={CrowdMonitor} />
      <Route path="/insights" component={AIInsights} />
      <Route path="/planner" component={RoutePlanner} />
      <Route path="/settings" component={AccountSettings} />
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route path="/scanner" component={ScannerPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function HeaderBar() {
  const { user } = useAuth();
  const isUserRole = user?.role === "user";
  return (
    <header className="flex items-center justify-between gap-4 px-4 h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 flex-shrink-0 shadow-sm">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      <div className="flex items-center gap-3">
        {user && isUserRole && (
          <Link href="/wallet">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors shadow-sm" data-testid="header-wallet-link">
              <WalletIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide" data-testid="text-header-balance">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(user.walletBalance)}
              </span>
            </div>
          </Link>
        )}
        <WeatherWidget />
        <div className="flex items-center gap-1.5 border-l border-border/40 pl-3 ml-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  const { toast } = useToast();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useEffect(() => {
    const socket = io();

    socket.on("crowdUpdate", (data: any) => {
      if (data.newLevel === "high") {
        toast({
          title: `High Crowd Alert: ${data.stationName}`,
          description: `Current passenger count: ${data.passengerCount}. Expect delays.`,
          variant: "destructive",
        });
      } else if (data.oldLevel === "high" && data.newLevel !== "high") {
        toast({
          title: `Crowd Clearing: ${data.stationName}`,
          description: `Station congestion has reduced to ${data.newLevel} levels.`,
        });
      }
    });

    // Simulate "Get Down" notification for active tickets
    const notificationInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/tickets/my");
        if (res.ok) {
          const tickets = await res.json();
          const activeTicket = tickets.find((t: any) => t.status === "active" && t.entryCount > 0 && t.exitCount === 0);
          if (activeTicket) {
             // Logic: If current time is some minutes after booking, simulate arrival
             const bookingTime = new Date(activeTicket.createdAt).getTime();
             const now = new Date().getTime();
             const diffMinutes = (now - bookingTime) / (1000 * 60);
             
             // In a real app, this would be triggered by GPS or real train position
             // For demo, we trigger it if the ticket is 1-2 minutes old
             if (diffMinutes > 1 && diffMinutes < 1.2) {
               toast({
                 title: "Station Approaching!",
                 description: `You are arriving at ${activeTicket.destName} shortly. Please prepare to get down.`,
                 duration: 10000,
               });
             }
          }
        }
      } catch (err) {
        // Silently fail if not logged in or network error
      }
    }, 15000);

    return () => {
      socket.disconnect();
      clearInterval(notificationInterval);
    };
  }, [toast]);

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <HeaderBar />
          <main className="flex-1 overflow-y-auto">
            <Router />
          </main>
        </div>
      </div>
      <AIChatbot />
    </SidebarProvider>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
          <TrainFrontIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AuthGate />
            </AuthProvider>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
