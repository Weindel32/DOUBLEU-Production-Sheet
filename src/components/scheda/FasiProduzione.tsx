"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { FASI_PRODUZIONE, SALTA, avanzamento, dataBreve, oggiItalia, type Fasi, type IdFase } from "@/lib/fasi";

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

  const spunta = (f: IdFase) => {
    const next = { ...fasi };
    if (next[f] && next[f] !== SALTA) delete next[f];
    else next[f] = oggiItalia();
    salva(next);
  };
  const salta = (f: IdFase) => {
    const next = { ...fasi };
    if (next[f] === SALTA) delete next[f];
    else next[f] = SALTA;
    salva(next);
  };
  return { fasi, errore, spunta, salta };
}

function Checklist({ fasi, errore, spunta, salta }: ReturnType<typeof useFasi>) {
  return (
    <div>
      <ul className="divide-y divide-[#EFEBE2]">
        {FASI_PRODUZIONE.map((f) => {
          const v = fasi[f.id];
          const saltata = v === SALTA;
          const fatta = !!v && !saltata;
          return (
            <li key={f.id} className="flex items-center gap-2 py-1">
              <button type="button" onClick={() => spunta(f.id)} disabled={saltata} aria-pressed={fatta}
                className="flex-1 min-w-0 min-h-11 flex items-center gap-3 rounded-lg px-2 text-left hover:bg-[#0E1B2C]/[0.03] disabled:hover:bg-transparent">
                <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  fatta ? "bg-[#1D6B4A] border-[#1D6B4A] text-white" : saltata ? "border-[#E4E0D6] bg-[#F6F4EF]" : "border-[#C9C3B5] bg-white"}`}>
                  {fatta && <Check size={15} strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[15px] ${saltata ? "text-[#A39E92] line-through" : fatta ? "text-[#0E1B2C] font-semibold" : "text-[#0E1B2C]"}`}>{f.label}</span>
                {fatta && <span className="text-xs text-[#5F6878] font-mono">{dataBreve(v)}</span>}
              </button>
              {/* Fasi che per questo articolo non esistono: escono dal conteggio. */}
              {!fatta && (
                <button type="button" onClick={() => salta(f.id)}
                  className="min-h-11 px-2 text-xs text-[#5F6878] hover:text-[#0E1B2C] underline-offset-2 hover:underline flex-shrink-0">
                  {saltata ? "Serve" : "Non serve"}
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

function Barra({ fatte, totali, completa }: { fatte: number; totali: number; completa: boolean }) {
  return (
    <span className="block h-1.5 rounded-full bg-[#EEEBE3] overflow-hidden">
      <span className={`block h-full rounded-full ${completa ? "bg-[#1D6B4A]" : "bg-[#1F3A68]"}`}
        style={{ width: `${totali ? Math.round((fatte / totali) * 100) : 0}%` }} />
    </span>
  );
}

/** Checklist delle fasi per la pagina della scheda (desktop e telefono). */
export function FasiLista({ id, fasi, aggiorna = true }: { id: string; fasi: Fasi; aggiorna?: boolean }) {
  const stato = useFasi(id, fasi, aggiorna);
  const a = avanzamento(stato.fasi);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-[#0E1B2C]">{a.completa ? "Produzione completata" : `Fase attuale: ${a.corrente!.label}`}</span>
        <span className="text-[#5F6878] font-mono">{a.fatte}/{a.totali}</span>
      </div>
      <Barra {...a} />
      <Checklist {...stato} />
    </div>
  );
}

/** Fase attuale compatta negli elenchi: un clic apre la checklist senza aprire la scheda. */
export default function FasiChip({ id, fasi, className = "" }: { id: string; fasi: Fasi; className?: string }) {
  const stato = useFasi(id, fasi);
  const a = avanzamento(stato.fasi);
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
    setPos(r && window.innerWidth >= 640 ? { top: Math.min(r.bottom + 6, window.innerHeight - 440), right: window.innerWidth - r.right } : null);
    setAperto(true);
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={apri} aria-haspopup="dialog" aria-expanded={aperto}
        title="Avanzamento produzione"
        className={`w-full min-w-[96px] text-left rounded-lg px-1.5 py-1 hover:bg-[#0E1B2C]/[0.04] ${className}`}>
        <span className={`flex items-baseline justify-between gap-1.5 text-xs font-semibold ${a.completa ? "text-[#1D6B4A]" : "text-[#1F3A68]"}`}>
          <span className="truncate">{a.completa ? "Pronto" : a.corrente!.breve}</span>
          <span className="font-mono font-normal text-[#5F6878]">{a.fatte}/{a.totali}</span>
        </span>
        <span className="block mt-1"><Barra {...a} /></span>
      </button>
      {aperto && (
        <div className="fixed inset-0 z-50" onClick={() => setAperto(false)}>
          <div className={pos ? "absolute inset-0" : "absolute inset-0 bg-[#0E1B2C]/30"} />
          <div role="dialog" aria-label="Fasi di produzione" onClick={(e) => e.stopPropagation()}
            style={pos ? { top: pos.top, right: pos.right } : undefined}
            className={pos
              ? "absolute w-80 bg-white border border-[#E4E0D6] rounded-xl shadow-xl p-3"
              : "absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"}>
            <div className="flex items-center justify-between mb-2 px-2">
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
