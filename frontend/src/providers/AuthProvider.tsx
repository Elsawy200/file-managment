"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get<{ user: User }>("/auth/profile");
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry || expiry <= Date.now()) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(logout, expiry - Date.now());
    return () => window.clearTimeout(timeoutId);
  }, [token, logout]);

  const login = useCallback(
    (authData: AuthResponse) => {
      localStorage.setItem("accessToken", authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      localStorage.setItem("user", JSON.stringify(authData.user));
      setToken(authData.accessToken);
      setUser(authData.user);
      router.push("/dashboard");
    },
    [router]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "ADMIN",
        login,
        logout,
        setUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

