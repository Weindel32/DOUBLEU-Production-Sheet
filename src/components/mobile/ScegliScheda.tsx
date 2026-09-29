"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Shirt } from "lucide-react";

export interface RigaScelta {
  id: string;
  titolo: string;
  codice: string;
  gruppo: string;
  dettaglio: string;
  foto: string | null;
}

/** Elenco di schede con ricerca, diviso per gruppo: tocchi e vai alla pagina `${base}/${id}`. */
export default function ScegliScheda({ righe, base, gruppi }: { righe: RigaScelta[]; base: string; gruppi: string[] }) {
  const [q, setQ] = useState("");
  const f = q.trim().toLowerCase();
  const visibili = f ? righe.filter((r) => [r.titolo, r.codice].some((v) => v.toLowerCase().includes(f))) : righe;

  return (
    <div className="px-4 space-y-4">
      <label className="h-12 bg-white border border-[#D6D1C4] rounded-xl flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca articolo o codice"
          aria-label="Cerca" className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-base" />
      </label>
      {visibili.length === 0 && <p className="text-center text-[#5F6878] py-8">Nessun risultato.</p>}
      {gruppi.map((g) => {
        const elenco = visibili.filter((r) => r.gruppo === g);
        if (elenco.length === 0) return null;
        return (
          <section key={g}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5F6878] mb-2 px-1">{g}</h2>
            <ul className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
              {elenco.map((r) => (
                <li key={r.id} className="border-b border-[#EFEBE2] last:border-0">
                  <Link href={`${base}/${r.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-[#FBFAF7]">
                    <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                      {r.foto ? <img src={r.foto} alt="" className="w-full h-full object-cover" /> : <Shirt size={20} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{r.titolo}</span>
                      <span className="block text-[13px] text-[#5F6878] truncate"><span className="font-mono">{r.codice}</span> · {r.dettaglio}</span>
                    </span>
                    <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
