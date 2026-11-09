"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import {
  FASI_PRODUZIONE, GIORNI_SOLLECITO, SALTA, avanzamento, dataBreve, oggiItalia, statoFase,
  type Avanzamento, type Fasi, type IdFase,
} from "@/lib/fasi";

function useFasi(id: string, iniziali: Fasi, aggiorna = true) {
  const [fasi, setFasi] = useState<Fasi>(iniziali);
  const [errore, setErrore] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const salva = async (next: Fasi) => {
    const prima = fasi;
    setFasi(next);
    setErrore(false);
    const res = await fetch(`/api/schede/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fasi: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setFasi(prima);
      setErrore(true);
      return;
    }
    // Nella pagina della scheda non si ricarica: lascia intatte le modifiche non ancora salvate.
    if (aggiorna) startTransition(() => router.refresh());
  };

  /** Un tocco: vuota → in corso (da oggi) → fatta (oggi) → vuota. */
  const avanza = (f: IdFase) => {
    const s = statoFase(fasi[f]);
    const next = { ...fasi };
    if (s.stato === "vuota") next[f] = { inizio: oggiItalia() };
    else if (s.stato === "corso") next[f] = { inizio: s.inizio, fine: oggiItalia() };
    else delete next[f];
    salva(next);
  };
  const salta = (f: IdFase) => {
    const next = { ...fasi };
    if (next[f] === SALTA) delete next[f];
    else next[f] = SALTA;
    salva(next);
  };
  /** Aggiornamento fatto in ritardo: si corregge la data di partenza (in corso) o di fine (fatta). */
  const data = (f: IdFase, iso: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso > oggiItalia()) return;
    const s = statoFase(fasi[f]);
    if (s.stato === "corso" && s.inizio !== iso) salva({ ...fasi, [f]: { inizio: iso } });
    if (s.stato === "fatta" && s.fine !== iso) salva({ ...fasi, [f]: { ...(s.inizio ? { inizio: s.inizio } : {}), fine: iso } });
  };
  return { fasi, errore, avanza, salta, data };
}

function Checklist({ fasi, errore, avanza, salta, data }: ReturnType<typeof useFasi>) {
  const oggi = oggiItalia();
  return (
    <div>
      <p className="text-xs text-[#5F6878] px-2 pb-1">Tocca una fase: <span className="font-semibold text-[#1F3A68]">in corso</span> → <span className="font-semibold text-[#1D6B4A]">fatta</span> → vuota. La data si corregge a destra.</p>
      <ul className="divide-y divide-[#EFEBE2]">
        {FASI_PRODUZIONE.map((f) => {
          const s = statoFase(fasi[f.id]);
          const dataFase = s.stato === "corso" ? s.inizio : s.stato === "fatta" ? s.fine : null;
          return (
            <li key={f.id} className="flex items-center gap-2 py-1">
              <button type="button" onClick={() => avanza(f.id)} disabled={s.stato === "salta"}
                aria-label={`${f.label}: ${s.stato === "corso" ? "in corso" : s.stato === "fatta" ? "fatta" : "da fare"}`}
                className="flex-1 min-w-0 min-h-12 flex items-center gap-3 rounded-lg px-2 text-left hover:bg-[#0E1B2C]/[0.03] disabled:hover:bg-transparent">
                <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  s.stato === "fatta" ? "bg-[#1D6B4A] border-[#1D6B4A] text-white"
                    : s.stato === "corso" ? "border-[#1F3A68] bg-[#E3E9F3]"
                      : s.stato === "salta" ? "border-[#E4E0D6] bg-[#F6F4EF]" : "border-[#C9C3B5] bg-white"}`}>
                  {s.stato === "fatta" && <Check size={15} strokeWidth={3} />}
                  {s.stato === "corso" && <span className="w-2.5 h-2.5 rounded-full bg-[#1F3A68]" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] ${s.stato === "salta" ? "text-[#A39E92] line-through" : s.stato === "vuota" ? "text-[#0E1B2C]" : "text-[#0E1B2C] font-semibold"}`}>{f.label}</span>
                  {s.stato === "corso" && <span className="block text-xs font-semibold text-[#1F3A68]">In corso</span>}
                  {s.stato === "fatta" && <span className="block text-xs text-[#1D6B4A]">Fatta{s.inizio ? ` · partita il ${dataBreve(s.inizio)}` : ""}</span>}
                </span>
              </button>
              {dataFase && (
                <input type="date" value={dataFase} max={oggi} title={s.stato === "corso" ? "Partita il" : "Finita il"}
                  aria-label={`${f.label}: ${s.stato === "corso" ? "partita il" : "finita il"}`}
                  onChange={(e) => data(f.id, e.target.value)}
                  className="h-9 w-[132px] flex-shrink-0 rounded-md border border-[#E4E0D6] bg-white px-2 text-xs font-mono text-[#0E1B2C] hover:border-[#0E1B2C]/40 focus:border-[#1F3A68]" />
              )}
              {/* Fasi che per questo articolo non esistono: escono dal conteggio. */}
              {(s.stato === "vuota" || s.stato === "salta") && (
                <button type="button" onClick={() => salta(f.id)}
                  className="min-h-11 px-2 text-xs text-[#5F6878] hover:text-[#0E1B2C] underline-offset-2 hover:underline flex-shrink-0">
                  {s.stato === "salta" ? "Serve" : "Non serve"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {errore && <p role="alert" className="text-sm text-red-700 px-2 pt-2">Non salvato, riprova.</p>}
    </div>
  );
}

const COLORE: Record<Avanzamento["situazione"], string> = {
  corso: "text-[#1F3A68]", attesa: "text-[#7A5B12]", pronto: "text-[#1D6B4A]", "da-avviare": "text-[#5F6878]",
};

/** "da 3 giorni" (in corso) o "ferma da 3 giorni" (in attesa). */
function testoGiorni(a: Avanzamento) {
  if (a.giorni === null) return null;
  const g = a.giorni === 0 ? "oggi" : a.giorni === 1 ? "1 giorno" : `${a.giorni} giorni`;
  return a.situazione === "attesa" ? `ferma da ${g}` : a.giorni === 0 ? "da oggi" : `da ${g}`;
}

function Barra({ a }: { a: Avanzamento }) {
  return (
    <span className="block h-1.5 rounded-full bg-[#EEEBE3] overflow-hidden">
      <span className={`block h-full rounded-full ${a.situazione === "pronto" ? "bg-[#1D6B4A]" : "bg-[#1F3A68]"}`}
        style={{ width: `${a.totali ? Math.round((a.fatte / a.totali) * 100) : 0}%` }} />
    </span>
  );
}

/** Checklist delle fasi per la pagina della scheda (desktop e telefono). */
export function FasiLista({ id, fasi, aggiorna = true }: { id: string; fasi: Fasi; aggiorna?: boolean }) {
  const stato = useFasi(id, fasi, aggiorna);
  const a = avanzamento(stato.fasi);
  const giorni = testoGiorni(a);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-[17px] font-bold ${COLORE[a.situazione]}`}>
          {a.situazione === "corso" ? `${a.inCorso!.label} in corso` : a.etichetta}
          {giorni && <span className={`text-sm ${a.giorni! >= GIORNI_SOLLECITO ? "text-[#A8461F] font-semibold" : "text-[#5F6878] font-normal"}`}> · {giorni}</span>}
        </span>
        <span className="text-sm text-[#5F6878] font-mono">{a.fatte}/{a.totali} fatte</span>
      </div>
      <Barra a={a} />
      <Checklist {...stato} />
    </div>
  );
}

/** Situazione compatta negli elenchi: un clic apre la checklist senza aprire la scheda. */
export default function FasiChip({ id, fasi, className = "" }: { id: string; fasi: Fasi; className?: string }) {
  const stato = useFasi(id, fasi);
  const a = avanzamento(stato.fasi);
  const giorni = testoGiorni(a);
  const [aperto, setAperto] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aperto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAperto(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aperto]);

  const apri = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = btnRef.current?.getBoundingClientRect();
    // Sul telefono la checklist sale dal basso; su schermi larghi si apre sotto il pulsante.
    setPos(r && window.innerWidth >= 640 ? { top: Math.max(8, Math.min(r.bottom + 6, window.innerHeight - 520)), right: window.innerWidth - r.right } : null);
    setAperto(true);
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={apri} aria-haspopup="dialog" aria-expanded={aperto}
        title="Avanzamento produzione"
        className={`w-full min-w-[96px] text-left rounded-lg px-1.5 py-1 hover:bg-[#0E1B2C]/[0.04] ${className}`}>
        <span className="flex items-baseline justify-between gap-1.5 text-xs">
          <span className={`truncate font-bold ${COLORE[a.situazione]}`}>{a.etichetta}</span>
          <span className="font-mono text-[#5F6878]">{a.fatte}/{a.totali}</span>
        </span>
        <span className="block mt-1"><Barra a={a} /></span>
        {giorni && (
          <span className={`block mt-1 text-[11px] ${a.giorni! >= GIORNI_SOLLECITO ? "text-[#A8461F] font-semibold" : "text-[#5F6878]"}`}>{giorni}</span>
        )}
      </button>
      {aperto && (
        <div className="fixed inset-0 z-50" onClick={() => setAperto(false)}>
          <div className={pos ? "absolute inset-0" : "absolute inset-0 bg-[#0E1B2C]/30"} />
          <div role="dialog" aria-label="Fasi di produzione" onClick={(e) => e.stopPropagation()}
            style={pos ? { top: pos.top, right: pos.right } : undefined}
            className={pos
              ? "absolute w-[420px] bg-white border border-[#E4E0D6] rounded-xl shadow-xl p-3"
              : "absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl shadow-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"}>
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="font-display font-bold text-[16px] text-[#0E1B2C]">Fasi di produzione</span>
              <button type="button" onClick={() => setAperto(false)} aria-label="Chiudi"
                className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-[#5F6878] hover:bg-[#0E1B2C]/5">
                <X size={18} />
              </button>
            </div>
            <Checklist {...stato} />
          </div>
        </div>
      )}
    </>
  );
}
