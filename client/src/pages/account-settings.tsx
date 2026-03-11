import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  WalletIcon,
  TicketIcon,
  CalendarIcon,
  SaveIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Ticket, WalletTransaction } from "@shared/schema";

export default function AccountSettings() {
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/my"],
  });

  const { data: transactions } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/auth/profile", {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/auth/profile", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password Changed", description: "Your password has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Mismatch", description: "New passwords don't match.", variant: "destructive" });
      return;
    }
    passwordMutation.mutate();
  };

  const activeTickets = tickets?.filter((t) => t.status === "active").length ?? 0;
  const totalTrips = tickets?.length ?? 0;
  const totalSpent = transactions
    ?.filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-settings-title">Account Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Card data-testid="card-account-overview">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-foreground">
                  {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate" data-testid="text-profile-name">{user?.name}</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <TicketIcon className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{totalTrips}</p>
              <p className="text-[10px] text-muted-foreground">Total Trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldCheckIcon className="w-5 h-5 text-chart-2 mx-auto mb-1" />
              <p className="text-lg font-bold">{activeTickets}</p>
              <p className="text-[10px] text-muted-foreground">Active Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <WalletIcon className="w-5 h-5 text-chart-4 mx-auto mb-1" />
              <p className="text-lg font-bold">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalSpent)}
              </p>
              <p className="text-[10px] text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-edit-profile">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="pl-10"
                  data-testid="input-profile-name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={user?.email ?? ""}
                  disabled
                  className="pl-10 opacity-60"
                  data-testid="input-profile-email"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone Number</Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="pl-10"
                  data-testid="input-profile-phone"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending || (profileForm.name === user?.name && profileForm.phone === user?.phone)}
              data-testid="button-save-profile"
            >
              {profileMutation.isPending ? "Saving..." : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-change-password">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <LockIcon className="w-4 h-4" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Current Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="pl-10 pr-10"
                    data-testid="input-current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">New Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pl-10 pr-10"
                    data-testid="input-new-password"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Confirm New Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="pl-10"
                    data-testid="input-confirm-password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={passwordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                data-testid="button-change-password"
              >
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
