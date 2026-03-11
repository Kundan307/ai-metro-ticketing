import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  role: string;
  createdAt: string;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 30000,
    retry: false,
  });

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, refetchUser: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
