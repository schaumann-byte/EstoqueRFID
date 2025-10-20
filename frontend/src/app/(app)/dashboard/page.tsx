import Sidebar from "@/components/sidebar";
import InventoryKpis from "@/components/InventoryKpis";
import StockStatusTable from "@/components/StockStatusTable";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto w-full max-w-[1400px] space-y-8">
          <div className="flex items-center justify-between mb-3 ml-1.5">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Visão Geral</h1>
            </div>
          </div>
          <InventoryKpis />
          <StockStatusTable />
        </div>
      </main>
    </div>
  );
}
