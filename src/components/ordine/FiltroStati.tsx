"use client";

import { useId, useState, type ReactNode } from "react";
import { GIORNI_SOLLECITO, type VoceStato } from "@/lib/fasi";

/**
 * Chip degli stati di un ordine ("Taglio 3", "Confezione 2"…): un tocco mostra solo gli articoli in quello stato.
 * Riparte sempre da "Tutte": un filtro dimenticato farebbe sembrare che manchino articoli.
 */
export function ChipStati({ voci, totale, valore, onChange, mobile = false }: {
  voci: VoceStato[];
  totale: number;
  valore: string | null;
  onChange: (v: string | null) => void;
  mobile?: boolean;
}) {
  const chip = (chiave: string | null, etichetta: string, n: number, fermo = false) => {
    const on = valore === chiave;
    return (
      <button key={chiave ?? "tutte"} type="button" aria-pressed={on} onClick={() => onChange(on ? null : chiave)}
        className={`${mobile ? "h-11" : "h-9"} px-3.5 rounded-full border text-sm inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-colors ${
          on ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold"
            : fermo ? "bg-[#FBEDE5] border-[#F2D2C1] text-[#A8461F] hover:border-[#A8461F]/50"
              : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
        {etichetta} <span className={`text-xs ${on ? "text-white/80" : "opacity-70"}`}>{n}</span>
      </button>
    );
  };
  return (
    <div role="group" aria-label="Filtra per stato"
      className={`flex gap-2 ${mobile ? "overflow-x-auto -mx-3 px-3 pb-0.5 [scrollbar-width:none]" : "flex-wrap"}`}>
      {chip(null, "Tutte", totale)}
      {voci.map((v) => chip(v.chiave, v.etichetta, v.n, v.chiave !== "bozza" && v.chiave !== "pronto" && v.giorniMax >= GIORNI_SOLLECITO))}
    </div>
  );
}

/** Stato scelto, ma solo se esiste ancora nell'ordine (un articolo può essere passato di fase intanto). */
export function useFiltroStato(voci: VoceStato[]) {
  const [scelto, setScelto] = useState<string | null>(null);
  const valore = scelto && voci.some((v) => v.chiave === scelto) ? scelto : null;
  return [valore, setScelto] as const;
}

/**
 * Desktop: le righe della tabella arrivano dal server con data-stato; qui si nascondono quelle degli altri stati.
 * Con un solo stato nell'ordine non c'è niente da filtrare e i chip non compaiono.
 */
export default function BloccoFiltrabile({ voci, totale, children }: { voci: VoceStato[]; totale: number; children: ReactNode }) {
  const [valore, setValore] = useFiltroStato(voci);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (voci.length < 2) return <>{children}</>;
  return (
    <div data-filtro-stati={id}>
      {valore && <style>{`[data-filtro-stati="${id}"] [data-stato]:not([data-stato="${valore}"]){display:none}`}</style>}
      <div className="px-5 py-3 border-b border-[#EFEBE2]">
        <ChipStati voci={voci} totale={totale} valore={valore} onChange={setValore} />
      </div>
      {children}
    </div>
  );
}
