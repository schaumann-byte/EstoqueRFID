import { notFound } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import OrderDetailClient from "@/components/OrderDetailClient"
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
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const data = await fetchOrderDetail(id);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <OrderDetailClient initialData={data} />
    </div>
  );
}

