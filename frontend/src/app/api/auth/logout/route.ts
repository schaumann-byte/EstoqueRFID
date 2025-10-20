import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export async function POST() {
  const resInit = NextResponse.next();
  const cookies = resInit.cookies;
  const rt = cookies.get("rt")?.value;

  if (rt) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rt),
    });
  }

  // apaga cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set("rt", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
