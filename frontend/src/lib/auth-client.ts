type LoginPayload = { username: string; password: string };

export async function apiLogin(p: LoginPayload): Promise<string> {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error((await r.json()).detail ?? "Login failed");
  const data = await r.json();
  return data.access_token as string;
}

export async function apiRefresh(): Promise<string> {
  const r = await fetch("/api/auth/refresh", { method: "POST" });
  if (!r.ok) throw new Error("Refresh failed");
  const data = await r.json();
  return data.access_token as string;
}

export async function apiLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
