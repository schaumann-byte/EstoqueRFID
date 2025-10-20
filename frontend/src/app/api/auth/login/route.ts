import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json(); // { username, password }
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return NextResponse.json(err, { status: r.status });
  }

  const data = await r.json(); // { access_token, refresh_token, token_type }

  // seta cookie httpOnly com o refresh
  const res = NextResponse.json({ access_token: data.access_token, token_type: data.token_type });

  res.cookies.set("rt", data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias (ajuste c/ seu BACKEND)
  });

  return res;
}
