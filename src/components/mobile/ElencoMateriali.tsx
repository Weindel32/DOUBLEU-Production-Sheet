"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Package } from "lucide-react";
import { formatEuro } from "@/lib/utils";

export interface RigaMateriale {
  id: string;
  nome: string;
  tipo: string;
  fornitore: string | null;
  codice: string | null;
  composizione: string | null;
  foto: string | null;
  prezzo: { valore: number | null; unita: string };
}

/** Elenco con ricerca istantanea: nome, fornitore, codice, composizione. */
export default function ElencoMateriali({ materiali }: { materiali: RigaMateriale[] }) {
  const [q, setQ] = useState("");
  const f = q.trim().toLowerCase();
  const visibili = f
    ? materiali.filter((m) => [m.nome, m.fornitore, m.codice, m.composizione, m.tipo].some((v) => v?.toLowerCase().includes(f)))
    : materiali;

  return (
    <div className="px-4 space-y-3">
      <label className="h-12 bg-white border border-[#D6D1C4] rounded-xl flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome, fornitore, codice"
          aria-label="Cerca materiali" className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-base" />
      </label>

      <ul className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
        {visibili.length === 0 && <li className="p-6 text-center text-[#5F6878]">Nessun materiale.</li>}
        {visibili.map((m) => (
          <li key={m.id} className="border-b border-[#EFEBE2] last:border-0">
            <Link href={`/m/materiali/${m.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-[#FBFAF7]">
              <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                {m.foto ? <img src={m.foto} alt="" className="w-full h-full object-cover" /> : <Package size={20} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{m.nome}</span>
                <span className="block text-[13px] text-[#5F6878] truncate">
                  {[m.fornitore, m.codice, m.composizione].filter(Boolean).join(" · ") || m.tipo}
                </span>
              </span>
              <span className="text-right flex-shrink-0">
                <span className="block font-mono font-semibold text-[15px]">{m.prezzo.valore !== null ? formatEuro(m.prezzo.valore) : "—"}</span>
                <span className="block text-xs text-[#5F6878]">{m.prezzo.unita}</span>
              </span>
              <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
