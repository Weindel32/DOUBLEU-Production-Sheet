"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, Shirt, ChevronRight } from "lucide-react";
import { FASCE_MODELLO, FASCIA_STYLE, ordinaCategorie } from "@/lib/utils";
import Miniatura from "@/components/ui/Miniatura";

export interface ModelloMobile {
  id: string;
  codice: string;
  descrizione: string;
  categoria: string;
  fascia: string;
  note: string | null;
  foto: string | null;
  /** Ordini in cui il modello è stato prodotto. */
  ordini: number;
  /** Schede più recenti con questo modello (articoli di costo e schede d'ordine). */
  schede: { id: string; nome: string; codice: string; ordine: string | null }[];
}

/** Modelli per categoria, con ricerca e filtro per fascia: tocca un modello per note e schede. */
export default function ElencoModelli({ modelli }: { modelli: ModelloMobile[] }) {
  const [q, setQ] = useState("");
  const [fascia, setFascia] = useState<string | null>(null);
  const [aperto, setAperto] = useState<string | null>(null);

  const f = q.trim().toLowerCase();
  const visibili = modelli.filter((m) =>
    (!fascia || m.fascia === fascia) &&
    (!f || [m.codice, m.descrizione, m.categoria, m.fascia, m.note].some((v) => v?.toLowerCase().includes(f))));
  const gruppi = ordinaCategorie(visibili.map((m) => m.categoria)).map((categoria) => ({
    categoria,
    modelli: visibili.filter((m) => m.categoria === categoria).sort((a, b) => a.codice.localeCompare(b.codice, "it", { numeric: true })),
  }));
  const fasce = FASCE_MODELLO.filter((x) => modelli.some((m) => m.fascia === x));

  return (
    <div className="px-4 space-y-3 pb-6">
      <label className="h-12 bg-white border border-[#D6D1C4] rounded-xl flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Codice, nome o categoria"
          aria-label="Cerca modelli" className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-base" />
      </label>

      {fasce.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {[null, ...fasce].map((x) => (
            <button key={x ?? "tutte"} type="button" aria-pressed={fascia === x} onClick={() => setFascia(x)}
              className={`h-9 px-3.5 rounded-full border text-sm whitespace-nowrap flex-shrink-0 ${fascia === x ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C]"}`}>
              {x ?? "Tutte"}
            </button>
          ))}
        </div>
      )}

      <p className="text-[13px] text-[#5F6878]">{visibili.length} {visibili.length === 1 ? "modello" : "modelli"}</p>

      {gruppi.length === 0 && <p className="text-center text-[#5F6878] py-8">Nessun modello.</p>}

      {gruppi.map((g) => (
        <section key={g.categoria} className="space-y-2">
          <h2 className="font-display font-bold text-[16px] text-[#1F3A68] pt-1">{g.categoria} <span className="text-[13px] font-semibold text-[#5F6878]">{g.modelli.length}</span></h2>
          {g.modelli.map((m) => {
            const on = aperto === m.id;
            return (
              <div key={m.id} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
                <button type="button" aria-expanded={on} onClick={() => setAperto(on ? null : m.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-[#FBFAF7]">
                  <span className="w-14 h-14 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                    {m.foto ? <Miniatura src={m.foto} lato={56} className="w-full h-full object-cover" /> : <Shirt size={22} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-mono font-semibold text-[15px]">{m.codice}</span>
                    <span className="block text-[14px] leading-snug truncate">{m.descrizione}</span>
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${FASCIA_STYLE[m.fascia] ?? "bg-[#EEEBE3] text-[#4A5566]"}`}>{m.fascia}</span>
                  <ChevronDown size={18} className={`text-[#C9C3B5] flex-shrink-0 transition-transform ${on ? "rotate-180" : ""}`} />
                </button>

                {on && (
                  <div className="border-t border-[#EFEBE2] px-4 py-3 space-y-3 text-[14px]">
                    {m.foto && (
                      <a href={m.foto} target="_blank" rel="noreferrer" className="block">
                        <Miniatura src={m.foto} alt={m.descrizione} lato={320} className="w-full max-h-80 object-contain rounded-xl bg-[#F6F4EF]" />
                      </a>
                    )}
                    {m.note ? <p className="whitespace-pre-line leading-relaxed">{m.note}</p> : <p className="text-[#5F6878]">Nessuna nota.</p>}
                    <p className="text-[13px] text-[#5F6878]">
                      {m.ordini > 0 ? `Prodotto in ${m.ordini} ${m.ordini === 1 ? "ordine" : "ordini"}` : "Mai prodotto in un ordine"}
                    </p>
                    {m.schede.length > 0 && (
                      <ul className="divide-y divide-[#EFEBE2] -mx-4 border-t border-[#EFEBE2]">
                        {m.schede.map((s) => (
                          <li key={s.id}>
                            <Link href={`/m/schede/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 active:bg-[#FBFAF7]">
                              <span className="flex-1 min-w-0">
                                <span className="block font-medium truncate">{s.nome}</span>
                                <span className="block text-[12px] text-[#5F6878] font-mono">{[s.codice, s.ordine ?? "articolo di costo"].join(" · ")}</span>
                              </span>
                              <ChevronRight size={16} className="text-[#C9C3B5] flex-shrink-0" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
