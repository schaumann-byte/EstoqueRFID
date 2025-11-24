// components/ItemsPanel.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, CalendarDays } from "lucide-react";
import AddItemModal, { type NewItemPayload } from "@/components/AddItemModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type ItemRow = {
  id: number;
  codigo_produto: number;
  etiqueta_rfid: string;
  timestamp_entrada: string;
  data_validade?: string | null;
  timestamp_saida?: string | null; // NULL => em estoque
  ultima_verificacao?: string | null;
  descricao: string;
  marca: string;
  categoria: string;
};

type ItemsPage = {
  items: ItemRow[];
  total: number;
  page: number;
  page_size: number;
};

type StockFilter = "inside" | "outside";

/** helpers */
function isBlankish(val?: string | null) {
  if (val == null) return true;
  const s = String(val).trim().toLowerCase();
  return s === "" || s === "null" || s === "undefined";
}
function hasSaida(val?: string | null) {
  return !isBlankish(val);
}
function fmtDate(val: string) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
function fmtDateTime(val: string) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusInfo(timestamp_saida?: string | null) {
  const outside = hasSaida(timestamp_saida);
  const inside = !outside;
  return {
    inside,
    label: inside ? "Dentro do estoque" : "Fora do estoque",
    dotClass: inside ? "bg-green-600" : "bg-red-500",
    pillClass: inside
      ? "text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200"
      : "text-red-700 bg-red-50 ring-1 ring-inset ring-red-200",
  };
}

async function fetchItemsClient(): Promise<ItemsPage> {
  const url = `${API_BASE.replace(/\/$/, "")}/metrics/items?page=1&page_size=50`;

  const res = await fetch(url, { 
    cache: "no-store",
    credentials: "include" 
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar items (${res.status}): ${text}`);
  }
  return res.json();
}

async function fetchDescriptions(): Promise<string[]> {
  try {
    const url = `${API_BASE.replace(/\/$/, "")}/items/descriptions`;
    const res = await fetch(url, { 
      cache: "no-store",
      credentials: "include" 
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.map((d: any) => d.descricao);
  } catch (error) {
    console.error("Erro ao buscar descrições:", error);
    return [];
  }
}

export default function ItemsPanel() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<StockFilter>("inside");
  const [page, setPage] = useState<ItemsPage | null>(null);
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const [itemsData, descriptionsData] = await Promise.all([
        fetchItemsClient(),
        fetchDescriptions(),
      ]);
      
      setPage(itemsData);
      setDescriptions(descriptionsData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateItem = async (payload: NewItemPayload) => {
    setCreating(true);
    
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/items`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Erro ao criar item" }));
        throw new Error(error.detail || "Erro ao criar item");
      }

      // Recarregar dados
      await loadData();
      
      // Fechar modal (será feito pelo AddItemModal após onCreate)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao criar item");
      throw error; // Re-throw para que o modal saiba que houve erro
    } finally {
      setCreating(false);
    }
  };

  const isOutside = filter === "outside";
  const toggleStatus = useCallback(() => {
    setFilter((prev) => (prev === "outside" ? "inside" : "outside"));
  }, []);

  const knobClass = useMemo(
    () =>
      `absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow transition-transform duration-300 ease-out
       ${isOutside ? "translate-x-[76px]" : "translate-x-0"}`,
    [isOutside]
  );

  const filteredItems = useMemo(() => {
    if (!page) return [];
    return page.items.filter((it) => {
      const isOut = hasSaida(it.timestamp_saida);
      return filter === "inside" ? !isOut : isOut;
    });
  }, [page, filter]);

  return (
    <>
      {/* HEADER + TOGGLE + BOTÃO */}
      <div className="m-1.5 mb-3 flex w-[98%] items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Itens – RFID</h1>
          <p className="text-sm text-slate-500">
            Gerencie seus itens de estoque e níveis de inventário
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4.0">
            <span className={`text-xs font-medium ${!isOutside ? "text-slate-900" : "text-slate-500"}`}>
              Dentro
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isOutside}
              aria-label={`Mostrar ${isOutside ? "Dentro do estoque" : "Fora do estoque"}`}
              onClick={toggleStatus}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleStatus();
                }
              }}
              className={`relative inline-flex items-center rounded-full border transition-colors duration-300 ease-out
                          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                          w-28 h-9 px-1
                          ${isOutside ? "bg-rose-200/70 border-rose-300" : "bg-emerald-200/70 border-emerald-300"}`}
              title={isOutside ? "Mostrar: Dentro do estoque" : "Mostrar: Fora do estoque"}
            >
              <span className={knobClass} />
            </button>

            <span className={`text-xs font-medium ${isOutside ? "text-slate-900" : "text-slate-500"}`}>
              Fora
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading && <div className="py-10 text-center text-sm text-slate-500">Carregando itens…</div>}

        {err && !loading && <div className="py-10 text-center text-sm text-red-600">{err}</div>}

        {!loading && !err && page && (
          <div className="overflow-x-auto">
            <div className="max-h-[320px] overflow-y-auto overscroll-contain">
              <table className="min-w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-4 py-2">Etiqueta (RFID)</th>
                    <th className="px-4 py-2">Descrição</th>
                    <th className="px-4 py-2">Marca</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Data</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((it) => {
                    const st = statusInfo(it.timestamp_saida);
                    const inside = st.inside;

                    let content: React.ReactNode;

                    if (inside) {
                      const validade = !isBlankish(it.data_validade)
                        ? fmtDate(it.data_validade as string)
                        : "Sem validade";

                      const lastCheck = !isBlankish(it.ultima_verificacao)
                        ? fmtDateTime(it.ultima_verificacao as string)
                        : "Nunca verificado";

                      content = (
                        <div className="flex flex-col gap-0.5 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">
                              <span className="font-medium">Validade:</span> {validade}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">
                              <span className="font-medium">Últ. verificação:</span> {lastCheck}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      const saida = !isBlankish(it.timestamp_saida)
                        ? fmtDateTime(it.timestamp_saida as string)
                        : "—";
                      content = (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">
                            <span className="font-medium">Saída:</span> {saida}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <tr key={it.id} className="bg-white align-middle border-b border-slate-200 last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                              <span className="text-slate-600 text-sm" aria-hidden>
                                🏷️
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-800">{it.etiqueta_rfid}</div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-800">{it.descricao}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700">{it.marca}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full ${st.dotClass}`}
                              aria-label={st.label}
                            />
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.pillClass}`}
                            >
                              {st.label}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {content}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        {filter === "inside"
                          ? "Nenhum item dentro do estoque."
                          : "Nenhum item fora do estoque."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Filtro: <strong>{isOutside ? "Fora do estoque" : "Dentro do estoque"}</strong>
              </span>
              <span>
                Exibindo {filteredItems.length} de {page.page_size} itens (página {page.page})
              </span>
            </div>
          </div>
        )}
      </div>

      <AddItemModal 
        open={open} 
        onClose={() => setOpen(false)} 
        onCreate={handleCreateItem}
        descriptionOptions={descriptions.length > 0 ? descriptions : undefined}
      />
    </>
  );
}




