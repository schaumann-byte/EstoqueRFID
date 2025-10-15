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

function percent(value: number, max: number) {
  if (!max || max <= 0) return 0;
  return Math.round((value / max) * 100);
}

async function fetchStock(): Promise<ProductStock[]> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const url = `${base.replace(/\/$/, "")}/metrics/stock-summary`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    // Propague erro para a Error Boundary da página
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar stock-summary (${res.status}): ${text}`);
  }
  return res.json();
}

export default async function StockStatusTable() {
  const data = await fetchStock();
  const maxEstoque = Math.max(0, ...data.map((d) => d.estoque_total));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Status do Estoque</h2>
        {/* coloque um Link "Ver todos" se desejar */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Categoria</th>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Estoque Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => {
              const pct = percent(p.estoque_total, maxEstoque);
              return (
                <tr
                  key={p.codigo}
                  className="rounded-xl bg-slate-50/60 align-top hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200">
                        {/* ícone dummy */}
                        <span className="text-slate-600">📦</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {p.descricao}
                        </div>
                        {/* Se quiser exibir um SKU, substitua abaixo */}
                        {/* <div className="text-xs text-slate-500">#SKU - {p.codigo}</div> */}
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
                        {p.estoque_total} {p.estoque_total === 1 ? "unidade" : "unidades"}
                      </span>
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-green-600"
                          style={{ width: `${pct}%` }}
                          aria-label="progress"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
