import Sidebar from "@/components/sidebar";
import InventoryKpis from "@/components/InventoryKpis";
import StockStatusTable from "@/components/StockStatusTable";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto w-full max-w-[1400px] space-y-8">
          {/* ⬇️ só o componente; nada de grid aqui */}
          <InventoryKpis />
          <StockStatusTable />
          <div className="h-[60vh] rounded-2xl border border-dashed border-slate-400 bg-white/30" />
        </div>
      </main>
    </div>
  );
}
