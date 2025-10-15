type ItemRow = {
  id: number;
  codigo_produto: number;
  etiqueta_rfid: string;
  timestamp_entrada: string;
  data_validade?: string | null;
  timestamp_saida?: string | null; // NULL => em estoque
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

function statusInfo(timestamp_saida?: string | null) {
  const inside = !timestamp_saida;
  return {
    inside,
    label: inside ? "Dentro do estoque" : "Fora do estoque",
    dotClass: inside ? "bg-green-600" : "bg-red-500",
    pillClass: inside
      ? "text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200"
      : "text-red-700 bg-red-50 ring-1 ring-inset ring-red-200",
  };
}

async function fetchItems(): Promise<ItemsPage> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
  const url = `${base.replace(/\/$/, "")}/metrics/items?page=1&page_size=50`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao buscar items (${res.status}): ${text}`);
  }
  return res.json();
}

export default async function ItemsStatusTable() {
  const page = await fetchItems();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Itens (RFID) — {page.total} no total
        </h2>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          <table className="min-w-full table-auto">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-2">Etiqueta (RFID)</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">Marca</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {page.items.map((it) => {
                const st = statusInfo(it.timestamp_saida);

                return (
                  <tr
                    key={it.id}
                    className="bg-white align-middle border-b border-slate-200 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                          <span className="text-slate-600 text-sm">🏷️</span>
                        </div>
                        <div className="text-sm font-medium text-slate-800">
                          {it.etiqueta_rfid}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-800">
                        {it.descricao}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">{it.marca}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${st.dotClass}`}
                          aria-hidden
                        />
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.pillClass}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {page.items.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé simples (pode evoluir para paginação real depois) */}
        <div className="mt-3 text-right text-xs text-slate-500">
          Exibindo até {page.page_size} itens (página {page.page})
        </div>
      </div>
    </div>
  );
}