"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, ScanLine, Calendar, PackagePlus } from "lucide-react";
import clsx from "clsx";

export type NewItemPayload = {
  etiqueta_rfid: string;
  categoria: string;
  marca: string;
  descricao: string;
  data_validade?: string | null; // ISO (yyyy-mm-dd) ou null
};

type AddItemModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate?: (payload: NewItemPayload) => void | Promise<void>;
  descriptionOptions?: string[];
};

const DESCRIPTION_OPTIONS_DEFAULT = [
  "Líquido de Arrefecimento Long Life 1L",
  "Óleo de Motor Sintético 5W30 1L",
  "Óleo de Motor Semissintético 15W40 1L",
  "Líquido de Arrefecimento Orgânico 5L",
  "Óleo para Transmissão 80W90 1L",
];

const CATEGORY_OPTIONS = ["Óleo Lubrificante", "Líquido de Arrefecimento"];

const BRAND_OPTIONS = [
  "Ipiranga",
  "Shell",
  "Mobil",
  "Castrol",
  "Lubrax",
  "Texaco",
  "Valvoline",
  "TotalEnergies",
  "Motul",
];

export default function AddItemModal({
  open,
  onClose,
  onCreate,
  descriptionOptions = DESCRIPTION_OPTIONS_DEFAULT,
}: AddItemModalProps) {
  // RFID (livre)
  const [rfid, setRfid] = useState("");

  // Categoria (lista)
  const [categoria, setCategoria] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [catIdx, setCatIdx] = useState(0);

  // Marca (lista)
  const [marca, setMarca] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandIdx, setBrandIdx] = useState(0);

  // Descrição (lista)
  const [descricao, setDescricao] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [descIdx, setDescIdx] = useState(0);

  // Validade
  const [validade, setValidade] = useState<string>("");

  const [touched, setTouched] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // foco ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFieldRef.current?.focus(), 10);
    }
  }, [open]);

  // fechar com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // filtros (case-insensitive)
  const filteredDesc = useMemo(() => {
    const q = descricao.trim().toLowerCase();
    if (!q) return descriptionOptions.slice(0, 8);
    return descriptionOptions.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
  }, [descricao, descriptionOptions]);

  const filteredCat = useMemo(() => {
    const q = categoria.trim().toLowerCase();
    if (!q) return CATEGORY_OPTIONS.slice(0, 8);
    return CATEGORY_OPTIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
  }, [categoria]);

  const filteredBrand = useMemo(() => {
    const q = marca.trim().toLowerCase();
    if (!q) return BRAND_OPTIONS.slice(0, 8);
    return BRAND_OPTIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 8);
  }, [marca]);

  // validação: precisa escolher opções válidas
  const isCategoriaValid = CATEGORY_OPTIONS.includes(categoria.trim());
  const isMarcaValid = BRAND_OPTIONS.includes(marca.trim());
  const isDescricaoValid = descriptionOptions.includes(descricao.trim());

  const invalid =
    !rfid.trim() || !isCategoriaValid || !isMarcaValid || !isDescricaoValid;

  function resetAndClose() {
    setRfid("");
    setCategoria("");
    setMarca("");
    setDescricao("");
    setValidade("");
    setTouched(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;

    const payload: NewItemPayload = {
      etiqueta_rfid: rfid.trim(),
      categoria: categoria.trim(),
      marca: marca.trim(),
      descricao: descricao.trim(),
      data_validade: validade ? validade : null,
    };

    await onCreate?.(payload);
    resetAndClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 md:p-8"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* overlay */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px]" />

      {/* painel */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">
              Adicionar Novo Item (RFID)
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RFID (livre) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                RFID *
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
                <ScanLine className="h-4 w-4 text-slate-400" />
                <input
                  ref={firstFieldRef}
                  type="text"
                  placeholder="Ex.: RFID-0019-I9J0"
                  value={rfid}
                  onChange={(e) => setRfid(e.target.value)}
                  className="w-full border-0 p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              {touched && !rfid.trim() && (
                <p className="mt-1 text-xs text-red-600">Informe a etiqueta RFID.</p>
              )}
            </div>

            {/* Categoria (apenas opções) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Categoria *
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Ex.: Óleo Lubrificante"
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setCatOpen(true);
                    setCatIdx(0);
                  }}
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 120)}
                  onKeyDown={(e) => {
                    if (!catOpen) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setCatIdx((i) => Math.min(i + 1, filteredCat.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setCatIdx((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      if (filteredCat[catIdx]) {
                        e.preventDefault();
                        setCategoria(filteredCat[catIdx]);
                        setCatOpen(false);
                      }
                    }
                  }}
                  className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400",
                    isCategoriaValid ? "border-slate-300 bg-white" : "border-red-300 bg-white"
                  )}
                />
                {catOpen && filteredCat.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {filteredCat.map((opt, i) => (
                      <li
                        key={opt}
                        className={clsx(
                          "cursor-pointer rounded-md px-2 py-1.5 text-sm",
                          i === catIdx ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCategoria(opt);
                          setCatOpen(false);
                        }}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {touched && !isCategoriaValid && (
                <p className="mt-1 text-xs text-red-600">
                  Escolha uma categoria válida.
                </p>
              )}
            </div>

            {/* Marca (apenas opções) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Marca *
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Ex.: Ipiranga / Shell"
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    setBrandOpen(true);
                    setBrandIdx(0);
                  }}
                  onFocus={() => setBrandOpen(true)}
                  onBlur={() => setTimeout(() => setBrandOpen(false), 120)}
                  onKeyDown={(e) => {
                    if (!brandOpen) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setBrandIdx((i) => Math.min(i + 1, filteredBrand.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setBrandIdx((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      if (filteredBrand[brandIdx]) {
                        e.preventDefault();
                        setMarca(filteredBrand[brandIdx]);
                        setBrandOpen(false);
                      }
                    }
                  }}
                  className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400",
                    isMarcaValid ? "border-slate-300 bg-white" : "border-red-300 bg-white"
                  )}
                />
                {brandOpen && filteredBrand.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {filteredBrand.map((opt, i) => (
                      <li
                        key={opt}
                        className={clsx(
                          "cursor-pointer rounded-md px-2 py-1.5 text-sm",
                          i === brandIdx ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setMarca(opt);
                          setBrandOpen(false);
                        }}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {touched && !isMarcaValid && (
                <p className="mt-1 text-xs text-red-600">Escolha uma marca válida.</p>
              )}
            </div>

            {/* Descrição (apenas opções) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Descrição (com sugestão) *
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Digite para filtrar…"
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value);
                    setDescOpen(true);
                    setDescIdx(0);
                  }}
                  onFocus={() => setDescOpen(true)}
                  onBlur={() => setTimeout(() => setDescOpen(false), 120)}
                  onKeyDown={(e) => {
                    if (!descOpen) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setDescIdx((i) => Math.min(i + 1, filteredDesc.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setDescIdx((i) => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                      if (filteredDesc[descIdx]) {
                        e.preventDefault();
                        setDescricao(filteredDesc[descIdx]);
                        setDescOpen(false);
                      }
                    }
                  }}
                  className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400",
                    isDescricaoValid ? "border-slate-300 bg-white" : "border-red-300 bg-white"
                  )}
                />
                {descOpen && filteredDesc.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    {filteredDesc.map((opt, i) => (
                      <li
                        key={opt}
                        className={clsx(
                          "cursor-pointer rounded-md px-2 py-1.5 text-sm",
                          i === descIdx ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDescricao(opt);
                          setDescOpen(false);
                        }}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {touched && !isDescricaoValid && (
                <p className="mt-1 text-xs text-red-600">
                  Escolha uma descrição válida da lista.
                </p>
              )}
            </div>

            {/* Data de validade */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Data de Validade
              </label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="w-full border-0 p-0 text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              disabled={invalid && touched}
            >
              Salvar produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

