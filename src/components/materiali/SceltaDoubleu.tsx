"use client";

import { COLORI_DOUBLEU, FAMIGLIE_DOUBLEU } from "@/lib/colori";
import Pallino from "@/components/materiali/Pallino";

/** I colori DOUBLEU per famiglia, con il nome scritto: si sceglie leggendo, non solo guardando. */
export default function SceltaDoubleu({ value, onChange }: { value: string; onChange: (nome: string) => void }) {
  return (
    <div className="space-y-2">
      {FAMIGLIE_DOUBLEU.map((f) => (
        <div key={f}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6878] mb-1">{f}</div>
          <div className="flex flex-wrap gap-1.5">
            {COLORI_DOUBLEU.filter((c) => c.famiglia === f).map((c) => {
              const on = value === c.nome;
              return (
                <button key={c.nome} type="button" aria-pressed={on} onClick={() => onChange(on ? "" : c.nome)}
                  className={`h-8 pl-1.5 pr-2.5 rounded-full border text-[13px] inline-flex items-center gap-1.5 ${on ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C]"}`}>
                  <Pallino hex={c.hex} size={16} /> {c.nome}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
