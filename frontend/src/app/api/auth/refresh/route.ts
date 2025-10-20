import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export async function POST() {
  // lê refresh do cookie httpOnly
  const resInit = NextResponse.next();
  const cookies = resInit.cookies;
  const rt = cookies.get("rt")?.value;

  if (!rt) return NextResponse.json({ detail: "No refresh cookie" }, { status: 401 });

  const r = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rt),
  });

  if (!r.ok) {
    return NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
  }

  const data = await r.json(); // { access_token, token_type }
  return NextResponse.json(data);
}
