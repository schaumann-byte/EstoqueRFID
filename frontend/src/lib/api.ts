export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 10 } });
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

export function fmtNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function fmtPercent(p: number) {
  return `${p.toFixed(1)}%`;
}