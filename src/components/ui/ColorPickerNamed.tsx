"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

export const PALETTE_COLORI = [
  { nome: "Nero", hex: "#000000" },
  { nome: "Bianco", hex: "#ffffff" },
  { nome: "Grigio chiaro", hex: "#d1d5db" },
  { nome: "Grigio", hex: "#6b7280" },
  { nome: "Grigio scuro", hex: "#374151" },
  { nome: "Rosso", hex: "#ef4444" },
  { nome: "Rosso scuro", hex: "#991b1b" },
  { nome: "Bordeaux", hex: "#7f1d1d" },
  { nome: "Arancione", hex: "#f97316" },
  { nome: "Giallo", hex: "#facc15" },
  { nome: "Verde chiaro", hex: "#86efac" },
  { nome: "Verde", hex: "#22c55e" },
  { nome: "Verde scuro", hex: "#15803d" },
  { nome: "Verde militare", hex: "#4d7c0f" },
  { nome: "Azzurro", hex: "#7dd3fc" },
  { nome: "Turchese", hex: "#06b6d4" },
  { nome: "Blu cielo", hex: "#38bdf8" },
  { nome: "Blu royal", hex: "#2563eb" },
  { nome: "Blu navy", hex: "#1e3a8a" },
  { nome: "Blu notte", hex: "#0f172a" },
  { nome: "Viola", hex: "#7c3aed" },
  { nome: "Lilla", hex: "#c4b5fd" },
  { nome: "Rosa", hex: "#f9a8d4" },
  { nome: "Rosa scuro", hex: "#ec4899" },
  { nome: "Marrone", hex: "#92400e" },
  { nome: "Beige", hex: "#fef9e7" },
  { nome: "Oro", hex: "#d97706" },
  { nome: "Argento", hex: "#9ca3af" },
];

export function getHexByName(nome: string): string | undefined {
  return PALETTE_COLORI.find(
    (c) => c.nome.toLowerCase() === nome.toLowerCase()
  )?.hex;
}

interface Props {
  value: string;
  onChange: (nome: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export default function ColorPickerNamed({ value, onChange, onBlur, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onBlur]);

  const hex =
    getHexByName(value) ||
    (/^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined);

  const filtered = search.trim()
    ? PALETTE_COLORI.filter((c) =>
        c.nome.toLowerCase().includes(search.toLowerCase())
      )
    : PALETTE_COLORI;

  const selectColor = (nome: string) => {
    onChange(nome);
    setOpen(false);
    setSearch("");
    onBlur?.();
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: hex || "#e5e7eb" }}
        />
        <span className={`text-sm flex-1 ${value ? "text-gray-700" : "text-gray-300 italic"}`}>
          {value || placeholder || "Seleziona colore..."}
        </span>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 mb-3">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca colore..."
              className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.nome}
                title={c.nome}
                onClick={(e) => {
                  e.stopPropagation();
                  selectColor(c.nome);
                }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-50 transition-colors ${
                  value === c.nome ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-gray-200"
                  style={{ backgroundColor: c.hex }}
                />
                <span
                  className="text-gray-500 leading-tight text-center"
                  style={{ fontSize: "9px" }}
                >
                  {c.nome}
                </span>
              </button>
            ))}

            {filtered.length === 0 && search.trim() && (
              <div className="col-span-4 text-center text-xs text-gray-400 py-3">
                Colore non trovato.
                <br />
                <button
                  className="text-blue-500 hover:underline mt-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectColor(search.trim());
                  }}
                >
                  Usa &ldquo;{search.trim()}&rdquo;
                </button>
              </div>
            )}
          </div>

          {value && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
              <div
                className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: hex || "#e5e7eb" }}
              />
              <span>
                Selezionato: <strong>{value}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
