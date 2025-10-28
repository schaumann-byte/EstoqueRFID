// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({ detail: "Erro no login" }));
      return NextResponse.json(err, { status: r.status });
    }

    const data = await r.json();

    const res = NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
    });

    // Configuração idêntica ao FastAPI
    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { detail: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
