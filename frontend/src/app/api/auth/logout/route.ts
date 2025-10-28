// app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export async function POST() {
  try {
    const store = await cookies();
    const refresh = store.get("refresh_token")?.value;

    // Chama o backend para revogar o token
    if (refresh) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refresh_token=${refresh}`,
        },
        credentials: "include",
      }).catch((err) => {
        console.error("Erro ao revogar token no backend:", err);
      });
    }

    const res = NextResponse.json({ ok: true });
    
    // Remove o cookie com as MESMAS configurações
    res.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // Expira imediatamente
    });

    return res;
  } catch (error) {
    console.error("Erro no logout:", error);
    
    // Mesmo com erro, remove o cookie
    const res = NextResponse.json({ ok: true });
    res.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    
    return res;
  }
}


