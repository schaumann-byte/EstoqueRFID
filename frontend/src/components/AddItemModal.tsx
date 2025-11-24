"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";

export type NewItemPayload = {
  etiqueta_rfid: string;
  descricao: string;
  categoria: string;
  marca: string;
  data_validade?: string | null;
};

type ProductOption = {
  descricao: string;
  categoria: string;
  marca: string;
};

type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewItemPayload) => Promise<void>;
  descriptionOptions?: string[];
};

export default function AddItemModal({
  open,
  onClose,
  onCreate,
  descriptionOptions = [],
}: AddItemModalProps) {
  const [etiqueta, setEtiqueta] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [validade, setValidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para controle de autocomplete
  const [showDescSuggestions, setShowDescSuggestions] = useState(false);
  const [showMarcaSuggestions, setShowMarcaSuggestions] = useState(false);
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  
  // Produtos completos do backend
  const [produtos, setProdutos] = useState<ProductOption[]>([]);

  // Carregar produtos ao abrir modal
  useEffect(() => {
    if (open) {
      fetchProdutos();
    }
  }, [open]);

  const fetchProdutos = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      const url = `${API_BASE.replace(/\/$/, "")}/items/descriptions`;
      const res = await fetch(url, { 
        cache: "no-store",
        credentials: "include" 
      });
      
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  // Extrair listas únicas
  const uniqueDescriptions = useMemo(() => {
    const set = new Set(produtos.map(p => p.descricao));
    return Array.from(set).sort();
  }, [produtos]);

  const uniqueMarcas = useMemo(() => {
    const set = new Set(produtos.map(p => p.marca));
    return Array.from(set).sort();
  }, [produtos]);

  const uniqueCategorias = useMemo(() => {
    const set = new Set(produtos.map(p => p.categoria));
    return Array.from(set).sort();
  }, [produtos]);

  // Filtrar sugestões
  const filteredDescriptions = useMemo(() => {
    if (!descricao) return uniqueDescriptions;
    return uniqueDescriptions.filter(d => 
      d.toLowerCase().includes(descricao.toLowerCase())
    );
  }, [descricao, uniqueDescriptions]);

  const filteredMarcas = useMemo(() => {
    if (!marca) return uniqueMarcas;
    return uniqueMarcas.filter(m => 
      m.toLowerCase().includes(marca.toLowerCase())
    );
  }, [marca, uniqueMarcas]);

  const filteredCategorias = useMemo(() => {
    if (!categoria) return uniqueCategorias;
    return uniqueCategorias.filter(c => 
      c.toLowerCase().includes(categoria.toLowerCase())
    );
  }, [categoria, uniqueCategorias]);

  // Auto-preencher campos quando descrição e marca são selecionados
  useEffect(() => {
    if (descricao && marca) {
      const produto = produtos.find(
        p => p.descricao === descricao && p.marca === marca
      );
      
      if (produto) {
        // Produto existe - preencher categoria automaticamente
        setCategoria(produto.categoria);
      }
      // Se não existe, deixa usuário preencher livremente
    }
  }, [descricao, marca, produtos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!etiqueta.trim()) {
      setError("Etiqueta RFID é obrigatória");
      return;
    }
    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return;
    }
    if (!marca.trim()) {
      setError("Marca é obrigatória");
      return;
    }
    if (!categoria.trim()) {
      setError("Categoria é obrigatória");
      return;
    }

    setLoading(true);

    try {
      const payload: NewItemPayload = {
        etiqueta_rfid: etiqueta.trim(),
        descricao: descricao.trim(),
        categoria: categoria.trim(),
        marca: marca.trim(),
        data_validade: validade.trim() || null,
      };

      await onCreate(payload);
      
      // Limpar form e fechar
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar item");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEtiqueta("");
    setDescricao("");
    setCategoria("");
    setMarca("");
    setValidade("");
    setError(null);
    setShowDescSuggestions(false);
    setShowMarcaSuggestions(false);
    setShowCatSuggestions(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Adicionar Novo Item</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {/* Etiqueta RFID */}
          <div>
            <label htmlFor="etiqueta" className="block text-sm font-medium text-slate-700 mb-1">
              Etiqueta RFID <span className="text-red-500">*</span>
            </label>
            <input
              id="etiqueta"
              type="text"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              placeholder="Ex: RFID-001"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Descrição com autocomplete */}
          <div className="relative">
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <input
              id="descricao"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              onFocus={() => setShowDescSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDescSuggestions(false), 200)}
              placeholder="Ex: Arroz Integral"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            />
            
            {/* Sugestões de descrição */}
            {showDescSuggestions && filteredDescriptions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredDescriptions.slice(0, 10).map((desc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDescricao(desc);
                      setShowDescSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    {desc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Marca com autocomplete */}
          <div className="relative">
            <label htmlFor="marca" className="block text-sm font-medium text-slate-700 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              id="marca"
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              onFocus={() => setShowMarcaSuggestions(true)}
              onBlur={() => setTimeout(() => setShowMarcaSuggestions(false), 200)}
              placeholder="Ex: Tio João"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            />
            
            {/* Sugestões de marca */}
            {showMarcaSuggestions && filteredMarcas.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredMarcas.slice(0, 10).map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMarca(m);
                      setShowMarcaSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Categoria com autocomplete */}
          <div className="relative">
            <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1">
              Categoria <span className="text-red-500">*</span>
            </label>
            <input
              id="categoria"
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              onFocus={() => setShowCatSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCatSuggestions(false), 200)}
              placeholder="Ex: Alimentos"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            />
            
            {/* Sugestões de categoria */}
            {showCatSuggestions && filteredCategorias.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredCategorias.slice(0, 10).map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      setShowCatSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data de Validade */}
          <div>
            <label htmlFor="validade" className="block text-sm font-medium text-slate-700 mb-1">
              Data de Validade <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              id="validade"
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Info sobre produto existente */}
          {descricao && marca && produtos.find(p => p.descricao === descricao && p.marca === marca) && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
              ℹ️ Produto existente detectado. Categoria preenchida automaticamente.
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Salvando..." : "Salvar Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
