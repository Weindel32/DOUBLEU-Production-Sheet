"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ColorPickerNamed from "@/components/ui/ColorPickerNamed";
import { Pallino } from "@/components/materiali/ColoriTessutoEditor";
import { chiaveFornitore, type ColoreTessuto } from "@/lib/colori";

/**
 * Colore della scheda scelto tra quelli disponibili del tessuto (con il codice del fornitore, che
 * arriva al produttore). Un colore fuori cartella resta possibile, con un avviso.
 */
export default function SceltaColoreTessuto({ value, codice, colori, tessuto, fornitore, onChange, placeholder }: {
  value: string;
  codice: string;
  colori: ColoreTessuto[];
  tessuto: string;
  fornitore: string | null;
  onChange: (nome: string, codice: string | null) => void;
  placeholder?: string;
}) {
  const fuoriCartella = !!value && !codice;
  const [libero, setLibero] = useState(fuoriCartella);

  if (colori.length === 0)
    return <ColorPickerNamed value={value} onChange={(nome) => onChange(nome, null)} placeholder={placeholder} />;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {colori.map((c) => {
          const on = codice === c.codice;
          return (
            <button key={c.codice} type="button" aria-pressed={on}
              onClick={() => { setLibero(false); onChange(on ? "" : c.nome ?? "", on ? null : c.codice); }}
              className={`h-9 pl-2 pr-2.5 rounded-full border text-[13px] inline-flex items-center gap-1.5 transition-colors ${on ? "bg-[#0E1B2C] border-[#0E1B2C] text-white" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
              <Pallino hex={c.hex} size={16} />
              <span className="font-mono font-semibold">{c.codice}</span>
              {c.nome && <span>{c.nome}</span>}
            </button>
          );
        })}
        <button type="button" onClick={() => setLibero((l) => !l)}
          className={`h-9 px-3 rounded-full border border-dashed text-[13px] ${libero ? "border-[#1F3A68] text-[#1F3A68]" : "border-[#C9C3B5] text-[#4A5566]"}`}>
          Altro colore…
        </button>
      </div>
      {libero && (
        <ColorPickerNamed value={codice ? "" : value} onChange={(nome) => onChange(nome, null)} placeholder={placeholder} />
      )}
      {fuoriCartella && (
        <p className="flex items-start gap-1.5 text-[13px] text-[#7A5B12] bg-[#FBF3DF] rounded-[10px] px-3 py-2">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
          {value} non risulta tra i colori di {tessuto}{chiaveFornitore(fornitore) ? ` (${chiaveFornitore(fornitore)})` : ""}: verifica col fornitore.
        </p>
      )}
    </div>
  );
}
