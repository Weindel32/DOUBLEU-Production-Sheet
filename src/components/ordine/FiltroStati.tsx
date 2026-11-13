"use client";

import { createContext, useCallback, useContext, useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
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

/** Articoli spuntati nell'ordine, per il conto da pagare. Le caselle sono nelle righe rese dal server. */
const Selezione = createContext<{
  scelti: Set<string>;
  cambia: (id: string) => void;
} | null>(null);

/** Casella di una riga: c'è solo dentro un ordine collegato all'Order App (il conto vive sull'ordine). */
export function CasellaScheda({ id, nome }: { id: string; nome: string }) {
  const ctx = useContext(Selezione);
  if (!ctx) return null;
  return (
    <label className="w-11 h-11 -mx-2 flex items-center justify-center cursor-pointer">
      <input type="checkbox" checked={ctx.scelti.has(id)} onChange={() => ctx.cambia(id)} aria-label={`Seleziona ${nome}`}
        className="w-5 h-5 accent-[#0E1B2C] cursor-pointer" />
    </label>
  );
}

/**
 * Desktop: le righe della tabella arrivano dal server con data-stato; qui si nascondono quelle degli altri stati
 * (i chip compaiono solo con almeno due stati). Con l'ordine collegato, gli articoli spuntati aprono il conto.
 */
export default function BloccoFiltrabile({ voci, righe, ordineId, children }: {
  voci: VoceStato[];
  /** Righe del blocco: per contare i pezzi scelti e selezionare quelle dello stato filtrato. */
  righe: { id: string; pezzi: number; stato: string }[];
  ordineId?: string;
  children: ReactNode;
}) {
  const [valore, setValore] = useFiltroStato(voci);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [scelti, setScelti] = useState<Set<string>>(() => new Set());

  const cambia = useCallback((sid: string) => setScelti((prev) => {
    const next = new Set(prev);
    if (next.has(sid)) next.delete(sid); else next.add(sid);
    return next;
  }), []);
  const ctx = useMemo(() => ({ scelti, cambia }), [scelti, cambia]);

  // Solo righe ancora presenti: una scheda eliminata o spostata esce anche dalla selezione.
  const validi = righe.filter((r) => scelti.has(r.id));
  const pezzi = validi.reduce((t, r) => t + r.pezzi, 0);
  const visibili = righe.filter((r) => !valore || r.stato === valore).map((r) => r.id);
  const tuttiVisibili = visibili.length > 0 && visibili.every((s) => scelti.has(s));

  const conto = ordineId && validi.length > 0
    ? `/schede/ordine/${encodeURIComponent(ordineId)}/conto?schede=${validi.map((r) => encodeURIComponent(r.id)).join(",")}`
    : null;

  return (
    <Selezione.Provider value={ordineId ? ctx : null}>
      <div data-filtro-stati={id}>
        {valore && <style>{`[data-filtro-stati="${id}"] [data-stato]:not([data-stato="${valore}"]){display:none}`}</style>}
        {(voci.length >= 2 || ordineId) && (
          <div className="px-5 py-3 border-b border-[#EFEBE2] flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex-1 min-w-0">
              {voci.length >= 2 && <ChipStati voci={voci} totale={righe.length} valore={valore} onChange={setValore} />}
            </div>
            {ordineId && (
              <button type="button" className="h-9 px-3 text-[13px] font-semibold text-[#1F3A68] hover:underline underline-offset-2 whitespace-nowrap"
                onClick={() => setScelti((prev) => {
                  const next = new Set(prev);
                  for (const s of visibili) if (tuttiVisibili) next.delete(s); else next.add(s);
                  return next;
                })}>
                {tuttiVisibili ? "Deseleziona" : valore ? "Seleziona questi" : "Seleziona tutti"}
              </button>
            )}
          </div>
        )}
        {children}
        {conto && (
          <div className="sticky bottom-0 z-10 px-5 py-3 border-t border-[#E4E0D6] bg-[#0E1B2C] text-white flex flex-wrap items-center gap-3">
            <span className="flex-1 text-sm">
              <strong>{validi.length} {validi.length === 1 ? "articolo selezionato" : "articoli selezionati"}</strong>
              {pezzi > 0 && <span className="text-white/75"> · {pezzi} pz</span>}
            </span>
            <button type="button" onClick={() => setScelti(new Set())} className="h-10 px-3 text-sm text-white/80 hover:text-white">Annulla</button>
            <Link href={conto} className="h-10 px-4 rounded-lg bg-white text-[#0E1B2C] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#EEF2F8]">
              <Receipt size={15} /> Conto selezione
            </Link>
          </div>
        )}
      </div>
    </Selezione.Provider>
  );
}
