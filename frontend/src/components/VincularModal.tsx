"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, AlertCircle, Loader2 } from "lucide-react";

type OutOfStockItem = {
  id: number;
  codigo_produto: number;
  etiqueta_rfid: string;
  timestamp_saida: string | null;
  data_validade: string | null;
  descricao: string;
  categoria: string | null;
  marca: string | null;
  ja_vinculado: boolean;
};

type VincularModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number;
  codigoProduto: number;
  produtoDescricao: string;
  onSuccess: () => void;
  vinculadoPor: string; // nome do usuário logado
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

export default function VincularModal({
  isOpen,
  onClose,
  pedidoId,
  codigoProduto,
  produtoDescricao,
  onSuccess,
  vinculadoPor,
}: VincularModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<OutOfStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRfid, setSelectedRfid] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);

  // Buscar itens quando o modal abre ou quando a busca muda
  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setSearchQuery("");
      setError(null);
      setSelectedRfid(null);
      return;
    }
    fetchItems();
  }, [isOpen, searchQuery]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
      const params = new URLSearchParams({
        page: "1",
        page_size: "50",
      });
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const url = `${base.replace(
        /\/$/,
        ""
      )}/vinculos/search/${pedidoId}/${codigoProduto}?${params}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Erro ao buscar itens");
      }

      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar itens");
    } finally {
      setLoading(false);
    }
  };

  const handleVincular = async (rfid: string) => {
    setVinculando(true);
    setError(null);

    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";
      const url = `${base.replace(
        /\/$/,
        ""
      )}/vinculos/${pedidoId}/${codigoProduto}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etiqueta_rfid: rfid,
          origem: "manual",
          vinculado_por: vinculadoPor,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao vincular item");
      }

      // Sucesso!
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao vincular item");
    } finally {
      setVinculando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Vincular Item Fora de Estoque
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Produto: <span className="font-medium">{produtoDescricao}</span> (
              Cód. {codigoProduto})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            disabled={vinculando}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por RFID, descrição ou marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              disabled={vinculando}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Items List */}
        <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              {searchQuery
                ? "Nenhum item encontrado para esta busca"
                : "Nenhum item fora de estoque disponível para este produto"}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                    item.ja_vinculado
                      ? "border-slate-200 bg-slate-50/50 opacity-60"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-medium text-slate-700">
                        {item.etiqueta_rfid}
                      </span>
                      {item.ja_vinculado && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Check size={12} />
                          Já vinculado
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-500">Marca:</span>{" "}
                        {item.marca || "—"}
                      </div>
                      <div>
                        <span className="text-slate-500">Categoria:</span>{" "}
                        {item.categoria || "—"}
                      </div>
                      <div>
                        <span className="text-slate-500">Validade:</span>{" "}
                        {fmtDate(item.data_validade)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Saída: {fmtDate(item.timestamp_saida)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleVincular(item.etiqueta_rfid)}
                    disabled={item.ja_vinculado || vinculando}
                    className={`ml-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      item.ja_vinculado || vinculando
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-slate-800 text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    }`}
                  >
                    {vinculando && selectedRfid === item.etiqueta_rfid ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Vincular
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={vinculando}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}