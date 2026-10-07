"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ColorPickerNamed from "@/components/ui/ColorPickerNamed";
import Pallino from "@/components/materiali/Pallino";
import { chiaveFornitore, COLORI_DOUBLEU, FAMIGLIE_DOUBLEU, hexDoubleu, nomeScheda, type ColoreTessuto } from "@/lib/colori";

const chip = (on: boolean) =>
  `h-9 pl-2 pr-3 rounded-full border text-[13.5px] inline-flex items-center gap-1.5 transition-colors ${on ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`;

/**
 * Colore della scheda: prima il colore DOUBLEU (solo quelli disponibili nel tessuto, per famiglia),
 * poi il codice del fornitore solo se a quel colore ne corrispondono più d'uno. Scelto il colore il
 * riquadro si chiude su una riga. Un colore fuori cartella resta possibile, con un avviso.
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
  const fornitoreK = chiaveFornitore(fornitore);
  const scelto = colori.find((c) => c.codice === codice);
  const fuoriCartella = !!value && !scelto;
  const [aperto, setAperto] = useState(!value);
  const [libero, setLibero] = useState(false);
  // Colore DOUBLEU con più codici: si sceglie il codice prima di chiudere.
  const [inScelta, setInScelta] = useState<string | null>(null);

  if (colori.length === 0)
    return <ColorPickerNamed value={value} onChange={(nome) => onChange(nome, null)} placeholder={placeholder} />;

  const scegli = (c: ColoreTessuto) => {
    onChange(nomeScheda(c), c.codice);
    setInScelta(null);
    setLibero(false);
    setAperto(false);
  };

  if (!aperto && value) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 border border-[#D6D1C4] rounded-xl px-3 py-2.5 bg-white">
          <Pallino hex={scelto?.hex ?? hexDoubleu(value)} size={20} />
          <span className="font-semibold text-[15px]">{value}</span>
          {scelto && (
            <span className="text-[13px] text-[#5F6878]">
              {fornitoreK} col. {scelto.codice}{scelto.nome && scelto.nome !== value ? ` ${scelto.nome}` : ""}
            </span>
          )}
          <span className="ml-auto flex gap-2">
            <button type="button" onClick={() => { setAperto(true); setInScelta(null); }}
              className="h-9 px-3.5 rounded-[10px] border border-[#D6D1C4] text-sm font-medium hover:border-[#0E1B2C]/40">Cambia</button>
            <button type="button" onClick={() => { onChange("", null); setAperto(true); }} aria-label="Togli il colore"
              className="h-9 px-3 rounded-[10px] text-sm text-[#5F6878] hover:text-[#A8461F]">Togli</button>
          </span>
        </div>
        {fuoriCartella && <AvvisoFuoriCartella value={value} tessuto={tessuto} fornitore={fornitoreK} />}
      </div>
    );
  }

  const daAbbinare = colori.filter((c) => !c.doubleu);
  const codiciInScelta = inScelta ? colori.filter((c) => c.doubleu === inScelta) : [];

  return (
    <div className="space-y-3 rounded-xl border border-[#E4E0D6] bg-[#FBFAF7] p-3">
      {FAMIGLIE_DOUBLEU.map((fam) => {
        const disponibili = COLORI_DOUBLEU.filter((d) => d.famiglia === fam && colori.some((c) => c.doubleu === d.nome));
        if (!disponibili.length) return null;
        return (
          <div key={fam}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6878] mb-1.5">{fam}</div>
            <div className="flex flex-wrap gap-1.5">
              {disponibili.map((d) => {
                const codici = colori.filter((c) => c.doubleu === d.nome);
                const on = inScelta === d.nome || (!inScelta && scelto?.doubleu === d.nome);
                return (
                  <button key={d.nome} type="button" aria-pressed={on} className={chip(on)}
                    onClick={() => (codici.length === 1 ? scegli(codici[0]) : setInScelta(d.nome))}>
                    <Pallino hex={d.hex} size={16} /> {d.nome}
                    {codici.length > 1 && <span className={`font-mono text-[11px] ${on ? "text-white/70" : "text-[#5F6878]"}`}>{codici.length} codici</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {codiciInScelta.length > 1 && (
        <div className="rounded-xl border border-dashed border-[#1F3A68] bg-[#E3E9F3] p-3 space-y-2">
          <div className="text-[13px] text-[#1F3A68]">{inScelta}: {fornitoreK || "il fornitore"} ha {codiciInScelta.length} codici. Quale?</div>
          <div className="flex flex-wrap gap-1.5">
            {codiciInScelta.map((c) => (
              <button key={c.codice} type="button" aria-pressed={codice === c.codice} className={chip(codice === c.codice)} onClick={() => scegli(c)}>
                <Pallino hex={c.hex} size={16} /> <span className="font-mono font-semibold">{c.codice}</span> {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {daAbbinare.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A8461F] mb-1.5">Codici da abbinare a un colore DOUBLEU</div>
          <div className="flex flex-wrap gap-1.5">
            {daAbbinare.map((c) => (
              <button key={c.codice} type="button" aria-pressed={codice === c.codice} className={chip(codice === c.codice)} onClick={() => scegli(c)}>
                <Pallino hex={c.hex} size={16} /> <span className="font-mono font-semibold">{c.codice}</span> {c.nome ?? ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setLibero((l) => !l)}
          className={`h-9 px-3 rounded-full border border-dashed text-[13px] ${libero ? "border-[#1F3A68] text-[#1F3A68]" : "border-[#C9C3B5] text-[#4A5566]"}`}>
          Altro colore…
        </button>
        {value && (
          <button type="button" onClick={() => setAperto(false)} className="h-9 px-3 text-[13px] text-[#1F3A68] underline underline-offset-2">
            Chiudi senza cambiare
          </button>
        )}
      </div>
      {libero && (
        <ColorPickerNamed value={scelto ? "" : value} placeholder={placeholder}
          onChange={(nome) => { onChange(nome, null); setLibero(false); setAperto(false); }} />
      )}
      {fuoriCartella && <AvvisoFuoriCartella value={value} tessuto={tessuto} fornitore={fornitoreK} />}
    </div>
  );
}

function AvvisoFuoriCartella({ value, tessuto, fornitore }: { value: string; tessuto: string; fornitore: string }) {
  return (
    <p className="flex items-start gap-1.5 text-[13px] text-[#7A5B12] bg-[#FBF3DF] rounded-[10px] px-3 py-2">
      <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
      {value} non risulta tra i colori di {tessuto}{fornitore ? ` (${fornitore})` : ""}: verifica col fornitore.
    </p>
  );
}
