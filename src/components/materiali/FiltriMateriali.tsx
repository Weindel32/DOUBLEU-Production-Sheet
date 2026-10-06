"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Ricerca libera + menu Colore e Fornitore: una barra sola, compatta anche con molti colori. */
export default function FiltriMateriali({ q, colore, fornitore, colori, fornitori }: {
  q: string;
  colore: string;
  fornitore: string;
  colori: string[];
  fornitori: string[];
}) {
  const router = useRouter();
  const vai = (cambio: Record<string, string>) => {
    const next = { q, colore, fornitore, ...cambio };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString();
    router.push(qs ? `/materiali?${qs}` : "/materiali");
  };
  const select = "h-12 border border-[#D6D1C4] rounded-xl bg-white px-3 text-[15px] text-[#0E1B2C] focus:border-[#1F3A68] outline-none";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={(e) => { e.preventDefault(); vai({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() }); }}
        className="flex-1 min-w-[220px]">
        <label className="h-12 border border-[#D6D1C4] rounded-xl bg-white flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
          <Search size={18} />
          <input type="search" name="q" defaultValue={q} placeholder="Cerca nome, codice, composizione" aria-label="Cerca materiali"
            className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-[15px]" />
        </label>
      </form>
      {colori.length > 0 && (
        <select value={colore} onChange={(e) => vai({ colore: e.target.value })} aria-label="Disponibile in colore" className={select}>
          <option value="">Tutti i colori</option>
          {colori.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {fornitori.length > 1 && (
        <select value={fornitore} onChange={(e) => vai({ fornitore: e.target.value })} aria-label="Fornitore" className={select}>
          <option value="">Tutti i fornitori</option>
          {fornitori.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      )}
    </div>
  );
}
