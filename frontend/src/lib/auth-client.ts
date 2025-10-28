type LoginPayload = { email: string; password: string };

export async function apiLogin(p: LoginPayload): Promise<string> {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
    credentials: "include", // <- recebe Set-Cookie do refresh
  });
  if (!r.ok) throw new Error((await r.json()).detail ?? "Login failed");
  const data = await r.json();
  return data.access_token as string;
}

export async function apiRefresh(): Promise<string> {
  const r = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include", // <- envia cookie refresh_token
  });
  if (!r.ok) throw new Error("Refresh failed");
  const data = await r.json();
  return data.access_token as string;
}

export async function apiLogout(): Promise<void> {
  const r = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // <- envia cookie p/ revogar no back
  });
  if (!r.ok) throw new Error("Logout failed");
}