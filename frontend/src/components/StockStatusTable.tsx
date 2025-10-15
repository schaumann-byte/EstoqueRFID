// app/components/StockStatusTable.tsx
// Server Component (Next.js App Router)

type ProductStock = {
  codigo: number;
  descricao: string;
  categoria?: string | null;
  marca?: string | null;
  estoque_total: number;
};

function padCode(codigo: number) {
  return `PRD-${String(codigo).padStart(3, "0")}`;
}

// % baseado em cap 10 unidades
function percent10(value: number) {
  const v = Math.max(0, Math.min(10, value));
  return Math.round((v / 10) * 100);
}

// cor por faixa (0–2: vermelho, 3–5: amarelo, >=6: verde)
function barColor(value: number) {
  if (value <= 3) return "bg-red-500";
  if (value <= 5) return "bg-yellow-400";
  return "bg-green-600";
}

async function fetchStock(): Promise<ProductStock[]> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const url = `${base.replace(/\/$/, "")}/metrics/stock-summary`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar stock-summary (${res.status}): ${text}`);
  }
  return res.json();
}

export default async function StockStatusTable() {
  const data = await fetchStock();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Status do Estoque
        </h2>
      </div>

      {/* container rolável horizontal + vertical */}
      <div className="overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          <table className="min-w-full table-auto">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Marca</th>
                <th className="px-4 py-2">Estoque Total</th>
              </tr>
            </thead>

            <tbody>
              {data.map((p, idx) => {
                const pct = percent10(p.estoque_total);
                const color = barColor(p.estoque_total);

                return (
                  <tr
                    key={p.codigo}
                    className="bg-white align-middle border-b border-slate-200 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                          <span className="text-slate-600 text-sm">📦</span>
                        </div>
                        <div className="text-sm font-medium text-slate-800">
                          {p.descricao}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-blue-700">
                        {padCode(p.codigo)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {p.categoria ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {p.marca ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] items-center gap-3">
                        <span className="whitespace-nowrap text-sm text-slate-700">
                          {p.estoque_total}{" "}
                          {p.estoque_total === 1 ? "unidade" : "unidades"}
                        </span>

                        {/* indicador + barra cap 10 */}
                        <div className="flex w-full items-center gap-2">
                          {/* ponto colorido (como no mock) */}
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
                            aria-hidden
                          />
                          <div className="h-2 w-full rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${pct}%` }}
                              aria-label="progress"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

