// app/itens/page.tsx (Server Component)

export const dynamic = 'force-dynamic'; // ou export const revalidate = 0;
import Sidebar from "@/components/sidebar";
import InventoryKpis from "@/components/InventoryKpis";
import ItemsStatusTable from "@/components/ItemStatusTable";
import ItemsHeader from "@/components/ItemHeader";

export default function ItensPage({
  searchParams,
}: {
  searchParams?: { status?: "inside" | "outside" };
}) {
  const statusParam = searchParams?.status;
  const status: "inside" | "outside" = statusParam === "outside" ? "outside" : "inside";

  // Lembre: console.log aqui aparece no servidor (terminal), não no devtools do navegador.
  console.log("status =>", status);

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

          {/* Tabela de itens filtrada */}
          <ItemsStatusTable/>
        </div>
      </main>
    </div>
  );
}



