import Sidebar from "@/components/sidebar";
import InventoryKpis from "@/components/InventoryKpis";
import ItemsStatusTable from "@/components/ItemStatusTable";

export default function ItensPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto w-full max-w-[1400px] space-y-8">
          {/* ⬇️ só o componente; nada de grid aqui */}
          <InventoryKpis />
          <ItemsStatusTable/>
        </div>
      </main>
    </div>
  );
}