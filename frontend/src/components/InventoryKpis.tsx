"use client";

import useSWR from "swr";
import KpiCard from "./KpiCard";
import { apiGet, fmtNumber } from "@/lib/api";
import { Package, AlertTriangle, CalendarClock, XCircle } from "lucide-react";

type StockSummary = {
  total_on_hand: number;
  abs_change_since_last_month: number;
  pct_change_since_last_month: number;
  distinct_products_on_hand: number;
};

type LowStockSummary = {
  threshold: number;
  count_low_stock: number;
  abs_change_since_last_month: number;
  pct_change_since_last_month: number;
};

type NearExpirySummary = {
  months: number;
  count: number;
  window_start: string;
  window_end: string;
};

type OutOfStockCount = { count: number };

export default function InventoryKpis() {
  const {
    data: stock,
    isLoading: l1,
    error: e1,
  } = useSWR<StockSummary>("/metrics/stock-amount", apiGet);

  const {
    data: low,
    isLoading: l2,
    error: e2,
  } = useSWR<LowStockSummary>("/metrics/low-stock?threshold=3", apiGet);

  const {
    data: near,
    isLoading: l3,
    error: e3,
  } = useSWR<NearExpirySummary>("/metrics/near-expiry?months=2", apiGet);

  const {
    data: out,
    isLoading: l4,
    error: e4,
  } = useSWR<OutOfStockCount>("/metrics/out-of-stock", apiGet);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total de Itens */}
      <KpiCard
        title="Total de Itens"
        value={stock ? fmtNumber(stock.total_on_hand) : "--"}
        icon={<Package className="h-5 w-5 text-blue-600" />}
        trend={
          stock && {
            value: stock.pct_change_since_last_month,
          }
        }
        loading={l1}
        error={e1?.message}
      />

      {/* Estoque Baixo */}
      <KpiCard
        title="Estoque Baixo"
        value={low ? fmtNumber(low.count_low_stock) : "--"}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        trend={
          low && {
            value: low.pct_change_since_last_month,
          }
        }
        loading={l2}
        error={e2?.message}
      />

      {/* Perto de Vencer (sem %) */}
      <KpiCard
        title="Perto de Vencer"
        value={near ? fmtNumber(near.count) : "--"}
        icon={<CalendarClock className="h-5 w-5 text-emerald-600" />}
        caption={near ? `até ${new Date(near.window_end).toLocaleDateString("pt-BR")}` : "próx. 2 meses"}
        loading={l3}
        error={e3?.message}
      />

      {/* Fora de Estoque (sem %) */}
      <KpiCard
        title="Fora de Estoque"
        value={out ? fmtNumber(out.count) : "--"}
        icon={<XCircle className="h-5 w-5 text-purple-600" />}
        caption="itens já baixados"
        loading={l4}
        error={e4?.message}
      />
    </div>
  );
}