// src/context/AuthContext.tsx
"use client";
import { createContext, useContext, useCallback, useState } from "react";

type AuthContextType = {
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body?.detail || "Login failed");
    }
    const data = await r.json(); // { access_token, token_type }
    setAccessToken(data.access_token);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
  }, []);

  const fetchWithAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      const res = await fetch(input, { ...init, headers });
      if (res.status === 401) {
        // tenta refresh
        const rr = await fetch("/api/auth/refresh", { method: "POST" });
        if (rr.ok) {
          const d = await rr.json();
          setAccessToken(d.access_token);
          headers.set("Authorization", `Bearer ${d.access_token}`);
          return fetch(input, { ...init, headers });
        }
      }
      return res;
    },
    [accessToken]
  );

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

