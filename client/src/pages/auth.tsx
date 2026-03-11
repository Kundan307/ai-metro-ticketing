import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  TrainFrontIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  ShieldCheckIcon,
  WalletIcon,
  MapPinIcon,
  ZapIcon,
  TicketIcon,
  ArrowRightIcon,
  Loader2Icon,
  ScanLineIcon,
} from "lucide-react";

const DEMO_EMAIL = "demo@bmrcl.com";
const DEMO_PASSWORD = "demo123";
const DEMO_SCANNER_EMAIL = "scanner@bmrcl.com";
const DEMO_ADMIN_EMAIL = "admin@bmrcl.com";

export default function AuthPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        email: form.email,
        password: form.password,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Welcome back!", description: "Logged in successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", form);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Account Created!", description: "Welcome to SmartAI Metro. You've received 500 bonus credits!" });
    },
    onError: (error: Error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const fillDemo = (type: "user" | "scanner" | "admin") => {
    let email = DEMO_EMAIL;
    if (type === "scanner") email = DEMO_SCANNER_EMAIL;
    if (type === "admin") email = DEMO_ADMIN_EMAIL;
    
    setForm({ ...form, email, password: DEMO_PASSWORD });
    setIsLogin(true);
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const features = [
    { icon: SparklesIcon, label: "AI Dynamic Pricing", desc: "Fares optimized in real-time based on demand and time of day" },
    { icon: WalletIcon, label: "Digital Wallet", desc: "Add funds and pay for tickets seamlessly from your account" },
    { icon: ShieldCheckIcon, label: "QR Code Tickets", desc: "Instant digital tickets with secure QR verification at gates" },
    { icon: MapPinIcon, label: "Live Train Tracking", desc: "See live train positions and crowd levels across the network" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-shrink-0 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #7B2D8E 0%, #5B1D6E 40%, #2A1040 70%, #1a0a2e 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20" style={{
          background: "linear-gradient(to top, #00A651, transparent)",
        }} />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10">
                <TrainFrontIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">SmartAI Metro</h2>
                <p className="text-xs text-white/60">Bangalore Metro Rail Corporation</p>
              </div>
            </div>
            <div>
              <h1 className="text-3xl xl:text-[2.1rem] font-bold text-white leading-tight tracking-tight">
                Your daily commute,<br />reimagined.
              </h1>
              <p className="text-sm text-white/55 mt-3 leading-relaxed max-w-[320px]">
                Book tickets, track trains, and navigate Bangalore Metro smarter with AI-powered tools.
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 flex-shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-white/80" />
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-white block">{f.label}</span>
                  <span className="text-[11px] text-white/45 leading-snug block mt-0.5">{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/50">52 Stations</span>
            </div>
            <div className="w-px h-3 bg-white/15" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: "#7B2D8E", border: "1px solid rgba(255,255,255,0.3)" }} />
              <span className="text-xs text-white/50">Purple</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: "#00A651" }} />
              <span className="text-xs text-white/50">Green</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 overflow-y-auto bg-background">
        <div className="w-full max-w-[380px] my-auto">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <TrainFrontIcon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-auth-title-mobile">SmartAI Metro</h1>
            <p className="text-xs text-muted-foreground mt-1">Bangalore Metro Rail Corporation</p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-auth-title">
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isLogin ? "Sign in to access your metro account" : "Create your account in seconds"}
            </p>
          </div>

          <div className="lg:hidden mb-6">
            <h2 className="text-lg font-semibold text-center" data-testid="text-auth-heading">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="card-auth-form">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-10 h-11 bg-background"
                      data-testid="input-name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-10 h-11 bg-background"
                      data-testid="input-phone"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 h-11 bg-background"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10 h-11 bg-background"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2"
              disabled={isPending}
              data-testid="button-auth-submit"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-5 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-background px-3 text-muted-foreground">or try it out</span>
              </div>
            </div>
          )}

          {isLogin && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer text-left group transition-colors"
                onClick={() => fillDemo("user")}
                data-testid="button-fill-demo"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-chart-4/10 flex-shrink-0">
                  <ZapIcon className="w-4 h-4 text-chart-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block">Use Demo Account</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Pre-loaded with ₹2,500 balance & sample tickets
                  </span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
              
              <div className="mt-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border bg-card cursor-pointer group transition-colors hover:bg-muted/50"
                  onClick={() => fillDemo("admin")}
                  data-testid="button-fill-demo-admin"
                >
                  <ShieldCheckIcon className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold">Admin Login</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "New to SmartAI Metro?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-semibold text-primary cursor-pointer"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-auth"
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>

          {!isLogin && (
            <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-chart-2/5 border border-chart-2/10">
              <TicketIcon className="w-3.5 h-3.5 text-chart-2" />
              <p className="text-xs text-muted-foreground">
                Get <span className="font-semibold text-chart-2">₹500 bonus credits</span> on signup
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
            BMRCL SmartAI Metro Ticketing System
          </p>
        </div>
      </div>
    </div>
  );
}
