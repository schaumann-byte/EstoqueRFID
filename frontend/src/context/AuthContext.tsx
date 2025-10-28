"use client";
import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";

type AuthContextType = {
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshing = useRef(false);

  // Tenta restaurar sessão ao montar (APENAS UMA VEZ)
  useEffect(() => {
    async function restore() {
      // Evita múltiplas tentativas simultâneas
      if (isRefreshing.current) return;
      
      try {
        isRefreshing.current = true;
        const r = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        
        if (r.ok) {
          const data = await r.json();
          setAccessToken(data.access_token);
        }
      } catch (err) {
        console.error("Falha ao restaurar sessão:", err);
      } finally {
        isRefreshing.current = false;
        setIsLoading(false);
      }
    }
    
    restore();
  }, []); // Array vazio = executa APENAS ao montar

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Evita refresh simultâneos
    if (isRefreshing.current) {
      return accessToken;
    }

    try {
      isRefreshing.current = true;
      const r = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      
      if (r.ok) {
        const data = await r.json();
        setAccessToken(data.access_token);
        return data.access_token;
      }
      
      // Refresh falhou, limpa token
      setAccessToken(null);
      return null;
    } catch (err) {
      console.error("Erro no refresh:", err);
      setAccessToken(null);
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, [accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body?.detail || "Login falhou");
    }
    
    const data = await r.json();
    setAccessToken(data.access_token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Erro no logout:", err);
    } finally {
      setAccessToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};

