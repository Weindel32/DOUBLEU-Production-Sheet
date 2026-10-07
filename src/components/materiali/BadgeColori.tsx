"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import Pallino from "@/components/materiali/Pallino";
import type { ColoreTessuto } from "@/lib/colori";

/** "20 colori" nell'elenco: un clic apre la lista con codici e nomi, senza lasciare la pagina. */
export default function BadgeColori({ colori, fornitore, cartellaData, cartellaFoto, hrefModifica }: {
  colori: ColoreTessuto[];
  fornitore: string | null;
  cartellaData: string | null;
  cartellaFoto: string | null;
  hrefModifica: string;
}) {
  const [aperto, setAperto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const daNominare = colori.filter((c) => !c.doubleu).length;

  useEffect(() => {
    if (!aperto) return;
    const fuori = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAperto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAperto(false); };
    document.addEventListener("mousedown", fuori);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuori); document.removeEventListener("keydown", esc); };
  }, [aperto]);

  if (colori.length === 0) return <span className="text-[#5F6878]">—</span>;

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setAperto((a) => !a)} aria-expanded={aperto}
        className="text-left rounded-lg px-2 py-1 -mx-2 hover:bg-[#0E1B2C]/[0.05]">
        <span className="block text-[14px] font-medium text-[#1F3A68] underline decoration-dotted underline-offset-4">
          {colori.length} {colori.length === 1 ? "colore" : "colori"}
        </span>
        {daNominare > 0 && <span className="block text-xs text-[#A8461F]">{daNominare} da abbinare</span>}
      </button>

      {aperto && (
        <div role="dialog" aria-label="Colori disponibili"
          className="absolute z-40 top-full left-0 mt-1 w-72 bg-white border border-[#E4E0D6] rounded-xl shadow-xl p-3 space-y-3">
          {cartellaFoto && (
            <a href={cartellaFoto} target="_blank" rel="noreferrer" className="block">
              <img src={cartellaFoto} alt="Cartella colori" className="w-full max-h-32 object-contain rounded-lg bg-[#EEEBE3]" />
            </a>
          )}
          <div className="flex items-baseline justify-between text-xs text-[#5F6878]">
            <span>{fornitore ? `Codici ${fornitore}` : "Codici"}</span>
            {cartellaData && <span>cartella {cartellaData}</span>}
          </div>
          <ul className="max-h-64 overflow-y-auto -mx-1">
            {colori.map((c) => (
              <li key={c.codice} className="flex items-center gap-2.5 px-1 py-1.5 text-[14px]">
                <Pallino hex={c.hex} size={16} />
                <span className="font-mono font-semibold w-10">{c.codice}</span>
                <span className={c.doubleu ? "text-[#0E1B2C]" : "text-[#A8461F] text-[13px]"}>{c.doubleu ?? "da abbinare"}</span>
                {c.nome && c.nome !== c.doubleu && <span className="text-[12px] text-[#5F6878] truncate">{c.nome}</span>}
                {c.soloQui && <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1F3A68] bg-[#E3E9F3] rounded px-1.5 py-0.5">solo qui</span>}
              </li>
            ))}
          </ul>
          <Link href={hrefModifica} className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[#D6D1C4] text-[13px] font-medium text-[#0E1B2C] hover:border-[#0E1B2C]/40">
            <Pencil size={14} /> Modifica colori
          </Link>
        </div>
      )}
    </div>
  );
}
