import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/sidebar"; // importa sua sidebar
import { Plus } from "lucide-react";

type OrderStatus = "aberto" | "entregue" | "cancelado";

type OrderDetail = {
  header: {
    id: number;
    status: OrderStatus;
    data_pedido: string;
    data_entrega?: string | null;
    observacoes?: string | null;
    cadastrado_por: string;
  };
  om: {
    id: number;
    sigla: string;
    nome: string;
  };
  totals: {
    total_solicitada: number;
    total_atendida: number;
    percentual_entregue: number;
  };
  lines: Array<{
    pedido_item_id: number;
    codigo_produto: number;
    produto_descricao: string;
    produto_categoria?: string | null;
    produto_marca?: string | null;
    quantidade_solicitada: number;
    quantidade_atendida: number;
    pendente: number;
    vinculos: Array<{
      item_id: number;
      etiqueta_rfid: string;
      vinculado_por?: string | null;
      vinculado_em?: string | null;
      origem_vinculo?: string | null;
    }>;
  }>;
};

function fmtDate(val?: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
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
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${dot[status]}`}
        aria-hidden
      />
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
      >
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="w-full rounded-full bg-slate-200 h-2"
      title={`${Math.round(v)}%`}
    >
      <div className="h-2 rounded-full bg-slate-800" style={{ width: `${v}%` }} />
    </div>
  );
}

async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const base =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const url = `${base.replace(/\/$/, "")}/metrics/orders/${id}/detail`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Erro ao carregar pedido #${id}`);
  return res.json();
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await fetchOrderDetail(params.id);
  const { header, om, totals, lines } = data;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] space-y-6">

          {/* Topbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/pedidos"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                ← Voltar
              </Link>
              <h1 className="text-xl font-semibold text-slate-800">
                Pedido #{header.id}
              </h1>
              <StatusPill status={header.status} />
            </div>
            <div className="text-sm text-slate-500">
              Cadastrado por{" "}
              <span className="font-medium text-slate-700">
                {header.cadastrado_por}
              </span>
            </div>
          </div>

          {/* Meta (OM, Datas, Totais) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[150px]">
              <div className="text-xs uppercase text-slate-500">OM</div>
              <div className="mt-1 text-lg font-semibold text-slate-800 truncate">
                {om.sigla}{" "}
                <span className="text-slate-500 font-normal">— {om.nome}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[150px]">
              <div className="text-xs uppercase text-slate-500">Datas</div>
              <div className="mt-1 text-slate-800 text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Pedido:</span>
                  <span className="font-medium">
                    {fmtDate(header.data_pedido)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Entrega:</span>
                  <span className="font-medium">
                    {fmtDate(header.data_entrega)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[150px]">
              <div className="text-xs uppercase text-slate-500">Totais</div>
              <div className="mt-2">
                <ProgressBar value={totals.percentual_entregue} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                <span>
                  {totals.total_atendida}/{totals.total_solicitada} itens
                </span>
                <span className="tabular-nums font-medium">
                  {Math.round(totals.percentual_entregue)}%
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[120px] overflow-y-auto mb-3">
            <div className="text-xs uppercase text-slate-500">Observações</div>
            <p className="mt-2 text-slate-700 text-sm">
              {header.observacoes?.trim() || "—"}
            </p>
          </div>

          {/*Teste Aspas*/}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-h-[320px] overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Itens do Pedido</h2>
                <div className="text-xs text-slate-500">
                {lines.length} linha{lines.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm">
                <thead>
                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                    <th className="px-3 py-2 w-[20%]">Produto</th>
                    <th className="px-3 py-2 w-[18%]">Categoria/Marca</th>
                    <th className="px-3 py-2 w-[7%]">Solic.</th>
                    <th className="px-3 py-2 w-[7%]">Atend.</th>
                    {/* removido Pendente */}
                    <th className="px-3 py-2 w-[42%]">RFIDs Vinculados</th>
                    <th className="px-3 py-2 w-[6%] text-center">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    {lines.length === 0 ? (
                    <tr>
                        <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500 text-sm"
                        >
                        Nenhuma linha de item neste pedido.
                        </td>
                    </tr>
                    ) : (
                    lines.map((ln) => (
                        <tr
                        key={ln.pedido_item_id}
                        className="border-b border-slate-200 last:border-b-0 align-top"
                        >
                        {/* Produto */}
                        <td className="px-3 py-3 w-[20%]">
                            <div className="font-medium text-slate-800 text-sm leading-tight line-clamp-2">
                            {ln.produto_descricao}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                            Cód. {ln.codigo_produto}
                            </div>
                        </td>

                        {/* Categoria/Marca */}
                        <td className="px-3 py-3 text-slate-700 w-[18%]">
                            <div className="truncate">{ln.produto_categoria || "—"}</div>
                            <div className="text-xs text-slate-500 truncate">
                            {ln.produto_marca || ""}
                            </div>
                        </td>

                        {/* Quantidades */}
                        <td className="px-3 py-3 tabular-nums text-center">
                            {ln.quantidade_solicitada}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-center">
                            {ln.quantidade_atendida}
                        </td>

                        {/* RFIDs (grid auto-fill + minmax para ocupar bem o espaço) */}
                        <td className="px-3 py-3">
                            {ln.vinculos.length === 0 ? (
                            <span className="text-slate-400 text-sm">Nenhum vínculo</span>
                            ) : (
                            <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                                {ln.vinculos.map((v) => (
                                <div
                                    key={`${v.item_id}-${v.etiqueta_rfid}`}
                                    className="group rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-50 px-3 py-1 text-xs text-slate-700 flex items-center justify-between transition-colors"
                                >
                                    <span className="font-medium truncate">
                                    {v.etiqueta_rfid}
                                    </span>
                                    {v.vinculado_em && (
                                    <span className="ml-2 text-[11px] text-slate-500 shrink-0">
                                        ({fmtDate(v.vinculado_em)})
                                    </span>
                                    )}
                                </div>
                                ))}
                            </div>
                            )}
                        </td>

                        {/* Botão de ação */}
                        <td className="px-3  text-center align-middle">
                            <button
                            type="button"
                            aria-label="Adicionar vínculo"
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                            <Plus size={14} />
                            Adicionar
                            </button>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </div>
        </div>
      </main>
    </div>
  );
}

