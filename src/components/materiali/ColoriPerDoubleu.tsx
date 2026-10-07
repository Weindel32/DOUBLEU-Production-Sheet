"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Pallino from "@/components/materiali/Pallino";
import { COLORI_DOUBLEU } from "@/lib/colori";

export interface DisponibileColore {
  doubleu: string;
  materialeId: string;
  tessuto: string;
  fornitore: string;
  codice: string;
  nome: string | null;
  hex: string | null;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * "Mi serve un bordeaux": per ogni colore DOUBLEU i tessuti in cui c'è, con il codice da ordinare.
 * La ricerca trova anche per famiglia ("rossi"), nome del fornitore ("vulcano") o codice.
 */
export default function ColoriPerDoubleu({ disponibili }: { disponibili: DisponibileColore[] }) {
  const [q, setQ] = useState("");
  const f = norm(q.trim());

  const gruppi = COLORI_DOUBLEU.map((d) => ({ ...d, voci: disponibili.filter((x) => x.doubleu === d.nome) }))
    .filter((g) => {
      if (!f) return g.voci.length > 0;
      return norm(g.nome).includes(f) || norm(g.famiglia).includes(f)
        || g.voci.some((v) => norm(v.nome ?? "").includes(f) || norm(v.tessuto).includes(f) || v.codice.toLowerCase() === f);
    });

  return (
    <div className="space-y-4">
      <label className="h-12 border border-[#D6D1C4] rounded-xl bg-white flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68] max-w-xl">
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Cerca un colore: bordeaux, navy, verde…" aria-label="Cerca un colore"
          className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-[15px]" />
      </label>

      {gruppi.length === 0 && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-12 text-[#5F6878]">
          Nessun colore DOUBLEU corrisponde a “{q}”.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {gruppi.map((g) => {
          const tessuti = [...new Set(g.voci.map((v) => v.materialeId))].length;
          return (
            <section key={g.nome} className="bg-white border border-[#E4E0D6] rounded-2xl p-4 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <Pallino hex={g.hex} size={22} />
                <h3 className="font-display text-[17px] font-bold text-[#0E1B2C]">{g.nome}</h3>
                <span className="ml-auto text-xs text-[#5F6878]">
                  {tessuti === 0 ? "nessun tessuto" : `${tessuti} ${tessuti === 1 ? "tessuto" : "tessuti"}`}
                </span>
              </div>
              {g.voci.length === 0 ? (
                <p className="text-[13px] text-[#5F6878]">Non c&apos;è in nessun tessuto in archivio.</p>
              ) : (
                <ul className="divide-y divide-[#EFEBE2]">
                  {/* Un tessuto per riga, con tutti i suoi codici che ricadono in questo colore. */}
                  {[...new Set(g.voci.map((v) => v.materialeId))].map((id) => {
                    const mie = g.voci.filter((v) => v.materialeId === id);
                    return (
                      <li key={id} className="flex items-start gap-2.5 py-2 text-[14px]">
                        <Link href={`/materiali/${id}/modifica`} className="font-semibold text-[#0E1B2C] hover:underline underline-offset-2 min-w-0 truncate">
                          {mie[0].tessuto}
                        </Link>
                        <span className="ml-auto flex flex-wrap justify-end gap-x-3 gap-y-1 text-[13px] text-[#5F6878]">
                          {mie.map((v) => (
                            <span key={v.codice} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Pallino hex={v.hex} size={12} />
                              {v.fornitore} <span className="font-mono font-semibold text-[#0E1B2C]">{v.codice}</span>
                              {v.nome && v.nome !== g.nome && <span>{v.nome}</span>}
                            </span>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
