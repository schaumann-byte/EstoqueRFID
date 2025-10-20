// components/ItemsHeader.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import AddItemModal from "@/components/AddItemModal";

export default function ItemsHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isOutside = params.get("status") === "outside";

  const toggleStatus = useCallback(() => {
    const next = isOutside ? "inside" : "outside";
    const q = new URLSearchParams(params);
    q.set("status", next);
    router.replace(`${pathname}?${q.toString()}`);
    router.refresh();
  }, [isOutside, params, pathname, router]);

  // Knob: calcula a translação certa p/ width escolhida
  // Track: w-28 (112px), px-1 (4px de cada lado) => inner 104px
  // Knob: w-7 (28px) => deslocamento = 104 - 28 = 76px
  const knobClass = useMemo(
    () =>
      `absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow transition-transform duration-300 ease-out
       ${isOutside ? "translate-x-[76px]" : "translate-x-0"}`,
    [isOutside]
  );

  return (
    <>
      <div className="m-1.5 mb-3 flex w-[98%] items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Itens – RFID</h1>
          <p className="text-sm text-slate-500">
            Gerencie seus itens de estoque e níveis de inventário
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle compacto e claro */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${!isOutside ? "text-slate-900" : "text-slate-500"}`}>
              Dentro
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isOutside}
              aria-label={`Mostrar ${isOutside ? "Dentro do estoque" : "Fora do estoque"}`}
              onClick={toggleStatus}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleStatus();
                }
              }}
              className={`relative inline-flex items-center rounded-full border transition-colors duration-300 ease-out
                          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                          w-28 h-9 px-1
                          ${isOutside ? "bg-rose-200/70 border-rose-300" : "bg-emerald-200/70 border-emerald-300"}`}
              title={isOutside ? "Mostrar: Dentro do estoque" : "Mostrar: Fora do estoque"}
            >
              <span className={knobClass} />
            </button>

            <span className={`text-xs font-medium ${isOutside ? "text-slate-900" : "text-slate-500"}`}>
              Fora
            </span>
          </div>

          {/* Botão Adicionar */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      <AddItemModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}






