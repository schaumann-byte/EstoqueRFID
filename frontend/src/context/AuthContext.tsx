"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { apiLogin, apiRefresh, apiLogout } from "@/lib/auth-client";

type AuthContextType = {
  accessToken: string | null;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    const token = await apiLogin({ username, password });
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
  }, []);

  // fetch que injeta Authorization e faz refresh automático
  const fetchWithAuth: AuthContextType["fetchWithAuth"] = useCallback(
    async (input, init = {}) => {
      const withAuth = (tok: string | null) => ({
        ...init,
        headers: {
          ...(init.headers || {}),
          ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
          "Content-Type": (init.headers as any)?.["Content-Type"] ?? "application/json",
        },
      });

      let r = await fetch(input, withAuth(accessToken));
      if (r.status !== 401) return r;

      // tenta refresh
      try {
        const newAccess = await apiRefresh();
        setAccessToken(newAccess);
        r = await fetch(input, withAuth(newAccess));
      } catch {
        setAccessToken(null);
      }
      return r;
    },
    [accessToken]
  );

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
