import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  const refresh = store.get("refresh_token")?.value;
  if (!refresh) return NextResponse.json({ detail: "No refresh cookie" }, { status: 401 });

  const r = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refresh_token=${refresh}` }, // <- encaminha como cookie
  });

  if (!r.ok) return NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
  const data = await r.json();
  return NextResponse.json(data);
}
