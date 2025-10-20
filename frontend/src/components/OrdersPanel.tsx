"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderStatus = "aberto" | "entregue" | "cancelado";
type OrdersFilter = OrderStatus | "todos";

type OrderRow = {
  id: number;
  om_sigla: string;
  data_pedido: string;
  status: OrderStatus;
  observacoes?: string | null;
  total_solicitada: number;
  total_atendida: number;
  percentual_entregue: number;
};

type OrdersPage = {
  items: OrderRow[];
  total: number;
  page: number;
  page_size: number;
};

function fmtDate(val: string) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    aberto: "text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200",
    entregue: "text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200",
    cancelado: "text-rose-700 bg-rose-50 ring-1 ring-inset ring-rose-200",
  };
  const dot: Record<OrderStatus, string> = {
    aberto: "bg-amber-500",
    entregue: "bg-emerald-600",
    cancelado: "bg-rose-500",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot[status]}`} aria-hidden />
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full rounded-full bg-slate-200 h-2">
      <div className="h-2 rounded-full bg-slate-800" style={{ width: `${v}%` }} />
    </div>
  );
}

async function fetchOrdersClient(
  status: OrdersFilter,
  page = 1,
  pageSize = 50
): Promise<OrdersPage> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "";
  const qp = new URLSearchParams();
  qp.set("page", String(page));
  qp.set("page_size", String(pageSize));
  if (status !== "todos") qp.set("status", status);
  const url = `${base.replace(/\/$/, "")}/metrics/overview?${qp.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar pedidos (${res.status}): ${text}`);
  }
  return res.json();
}

export default function OrdersPanel() {
  const router = useRouter();
  const [filter, setFilter] = useState<OrdersFilter>("todos");
  const [data, setData] = useState<OrdersPage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetchOrdersClient(filter, pageNum, pageSize)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [filter, pageNum]);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1),
    [data]
  );

  return (
    <>
      {/* HEADER + FILTRO */}
      <div className="m-1.5 mb-3 flex w-[98%] items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Pedidos – Visão Geral</h1>
          <p className="text-sm text-slate-500">Acompanhe status e percentual entregue</p>
        </div>

        <div className="flex items-center gap-2">
          {(["todos", "aberto", "entregue", "cancelado"] as OrdersFilter[]).map((s) => {
            const active = filter === s;
            const label = s === "todos" ? "Todos" : s[0].toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                onClick={() => { setFilter(s); setPageNum(1); }}
                className={`px-3 py-1.5 rounded-full text-sm border
                  ${active ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading && <div className="py-10 text-center text-sm text-slate-500">Carregando pedidos…</div>}
        {err && !loading && <div className="py-10 text-center text-sm text-rose-600">{err}</div>}

        {!loading && !err && data && (
          <>
            <div className="overflow-x-auto">
              <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                <table className="min-w-full table-auto">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">OM</th>
                      <th className="px-4 py-2">Data</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">% Entregue</th>
                      <th className="px-4 py-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row) => {
                      const href = `/pedidos/${row.id}`;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => router.push(href)}
                          className="bg-white align-middle border-b border-slate-200 last:border-b-0 cursor-pointer hover:bg-slate-50 transition"
                          title="Abrir detalhes do pedido"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <Link
                              href={href}
                              className="text-slate-900 underline-offset-4 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              #{row.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{row.om_sigla}</td>
                          <td className="px-4 py-3">{fmtDate(row.data_pedido)}</td>
                          <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                          <td className="px-4 py-3 w-64">
                            <div className="flex items-center gap-3">
                              <div className="min-w-32 w-full">
                                <ProgressBar value={row.percentual_entregue} />
                              </div>
                              <span className="tabular-nums text-slate-700">
                                {Math.round(row.percentual_entregue)}%
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.total_atendida}/{row.total_solicitada} itens
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[420px] text-slate-700 truncate">
                            {row.observacoes ?? "—"}
                          </td>
                        </tr>
                      );
                    })}

                    {data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                          Nenhum pedido para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Filtro: <strong>{filter === "todos" ? "Todos" : filter[0].toUpperCase() + filter.slice(1)}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    Exibindo {data.items.length} de {data.page_size} itens (página {data.page})
                  </span>
                  <div className="ml-2 flex gap-2">
                    <button
                      className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
                      onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                      disabled={pageNum <= 1}
                    >
                      Anterior
                    </button>
                    <span> {pageNum} / {totalPages} </span>
                    <button
                      className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
                      onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
                      disabled={pageNum >= totalPages}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

