"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Shirt, ShoppingCart } from "lucide-react";
import StatoSchedaToggle, { RendiEsecutive } from "@/components/scheda/StatoSchedaToggle";
import FasiChip from "@/components/scheda/FasiProduzione";
import { leggiFasi, riepilogoFasi, tempoOrdine } from "@/lib/fasi";
import Miniatura from "@/components/ui/Miniatura";

type Filtro = "tutte" | "esecutiva" | "bozza";
const FILTRI: { value: Filtro; label: string }[] = [
  { value: "tutte", label: "Tutte" },
  { value: "esecutiva", label: "Esecutive" },
  { value: "bozza", label: "Bozze" },
];

export interface RigaOrdine {
  id: string;
  /** Blocco di appartenenza: l'ordine, o il club per le schede senza ordine. */
  blocco: string;
  nome: string;
  codice: string;
  stato: string;
  fasi: string | null;
  pezzi: number;
  stimati: boolean;
  orfana: boolean;
  foto: string | null;
  aggiornata: string;
}

export interface BloccoOrdine {
  chiave: string;
  ordineId: string | null;
  cliente: string | null;
  /** Stato dell'ordine nell'Order App, già leggibile; vuoto se l'ordine non si trova. */
  statoOrdine: string;
  /** L'ordine esiste nell'Order App. */
  trovato: boolean;
  /** Parti di referenza previste dall'ordine (adulto/bambino), se le dichiara. */
  parti: number | null;
}

/**
 * Schede raggruppate per ordine. Il filtro di stato lavora sui dati già arrivati: il cambio è immediato,
 * e resta nell'indirizzo (?stato=) così tornando da una scheda si ritrova lo stesso elenco.
 */
export default function ElencoOrdini({ righe, blocchi }: { righe: RigaOrdine[]; blocchi: BloccoOrdine[] }) {
  const sp = useSearchParams();
  const stato = sp.get("stato");
  const filtro: Filtro = stato === "bozza" || stato === "esecutiva" ? stato : "tutte";
  const ordineAperto = sp.get("ordine");

  const scegli = (f: Filtro) => {
    const q = new URLSearchParams(sp.toString());
    if (f === "tutte") q.delete("stato");
    else q.set("stato", f);
    const testo = q.toString();
    // Senza passare dal server: Next allinea useSearchParams alla nuova barra degli indirizzi.
    window.history.replaceState(null, "", testo ? `?${testo}` : location.pathname);
  };

  const conta = (f: Filtro) => (f === "tutte" ? righe.length : righe.filter((r) => r.stato === f).length);
  const visibili = filtro === "tutte" ? righe : righe.filter((r) => r.stato === filtro);
  const infoDi = new Map(blocchi.map((b) => [b.chiave, b]));
  // Un blocco per ordine, in cima l'ultimo toccato (le righe arrivano già dalla più recente).
  const gruppi = new Map<string, RigaOrdine[]>();
  for (const r of visibili) gruppi.set(r.blocco, [...(gruppi.get(r.blocco) ?? []), r]);
  const elenco = [...gruppi].flatMap(([chiave, rr]) => {
    const info = infoDi.get(chiave);
    return info ? [{ info, righe: rr }] : [];
  });

  return (
    <div className="px-4 space-y-3">
      <div role="group" aria-label="Stato" className="flex bg-[#EEEBE3] rounded-xl p-1">
        {FILTRI.map((f) => {
          const on = f.value === filtro;
          return (
            <button key={f.value} type="button" onClick={() => scegli(f.value)} aria-pressed={on}
              className={`flex-1 h-11 rounded-lg flex items-center justify-center gap-1.5 text-[15px] ${on ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
              {f.label} <span className="text-xs text-[#5F6878] font-normal">{conta(f.value)}</span>
            </button>
          );
        })}
      </div>

      {elenco.length === 0 && (
        <p className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">Nessuna scheda.</p>
      )}

      {elenco.map(({ info: b, righe: rr }, i) => {
        const valide = rr.filter((r) => !r.orfana);
        const pezzi = valide.reduce((t, r) => t + r.pezzi, 0);
        const stimati = valide.some((r) => r.stimati);
        const bozze = valide.filter((r) => r.stato === "bozza").map((r) => r.id);
        const fasiEsecutive = valide.filter((r) => r.stato === "esecutiva").map((r) => leggiFasi(r.fasi));
        const fasiOrdine = riepilogoFasi(fasiEsecutive);
        const tempo = tempoOrdine(fasiEsecutive, bozze.length === 0);
        return (
          <details key={b.chiave} data-blocco={b.ordineId ?? b.chiave} id={b.ordineId ? `ordine-${b.ordineId}` : undefined}
            open={ordineAperto ? b.ordineId === ordineAperto : i === 0 && elenco.length <= 3} className="group scroll-mt-[calc(60px+env(safe-area-inset-top))] bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
            <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 px-4 py-3.5 active:bg-[#FBFAF7]">
              <span className="flex-1 min-w-0">
                <span className={`block font-display font-bold text-[17px] truncate ${b.cliente ? "text-[#1F3A68]" : "text-[#5F6878]"}`}>{b.cliente ?? "Senza cliente"}</span>
                <span className="block text-[13px] text-[#5F6878] truncate">
                  {b.ordineId ? <><span className="font-mono">{b.ordineId}</span>{b.statoOrdine && ` · ${b.statoOrdine}`}</> : "Senza ordine collegato"}
                </span>
                <span className="block text-[13px] text-[#0E1B2C] mt-0.5">
                  {valide.length}{b.parti ? ` su ${b.parti}` : ""} {valide.length === 1 && !b.trovato ? "referenza" : "referenze"}
                  {pezzi > 0 && ` · ${pezzi} pz${stimati ? " (stima)" : ""}`}
                </span>
                {tempo && <span className={`block text-[13px] font-bold mt-0.5 ${tempo.chiuso ? "text-[#1D6B4A]" : "text-[#0E1B2C]"}`}>{tempo.testo}</span>}
                {fasiOrdine && !tempo?.chiuso && <span className="block text-[13px] font-semibold text-[#1F3A68] mt-0.5">{fasiOrdine}</span>}
              </span>
              <ChevronDown size={20} className="text-[#5F6878] transition-transform group-open:rotate-180 flex-shrink-0" />
            </summary>

            <ul className="border-t border-[#EFEBE2]">
              {rr.map((s) => (
                <li key={s.id} className="flex items-center border-b border-[#EFEBE2] last:border-0">
                  <Link href={`/m/schede/${s.id}`} className="flex-1 min-w-0 flex items-center gap-3 pl-3 py-3 active:bg-[#FBFAF7]">
                    <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                      {s.foto ? <Miniatura src={s.foto} lato={48} className="w-full h-full object-cover" /> : <Shirt size={20} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{s.nome}</span>
                      <span className="block text-[13px] text-[#5F6878] truncate">
                        <span className="font-mono">{s.codice}</span>
                        {s.pezzi > 0 && ` · ${s.pezzi} pz${s.stimati ? " stimati" : ""}`}
                      </span>
                      {s.orfana && <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FBEDE5] text-[#A8461F]">Non più nell&apos;ordine</span>}
                    </span>
                  </Link>
                  {/* Stato fuori dal link: un tocco sul badge cambia Bozza ⇄ Esecutiva senza aprire la scheda. */}
                  <span className="flex flex-col items-end gap-1 pl-2 pr-3 py-2 flex-shrink-0">
                    <StatoSchedaToggle key={s.stato} id={s.id} stato={s.stato} className="min-h-11 px-3.5" />
                    {s.stato === "esecutiva"
                      ? <FasiChip id={s.id} fasi={leggiFasi(s.fasi)} className="w-[112px]" />
                      : <span className="text-xs text-[#5F6878]">{s.aggiornata}</span>}
                  </span>
                </li>
              ))}
            </ul>

            {(b.ordineId || bozze.length > 0) && (
              <div className="p-3 border-t border-[#EFEBE2] bg-[#FBFAF7] space-y-2">
                {bozze.length > 0 && (
                  <RendiEsecutive ids={bozze}
                    className="w-full h-12 rounded-xl border border-[#BFDFCC] bg-[#DDEFE5] text-[15px] font-semibold text-[#1D6B4A] flex items-center justify-center gap-2 disabled:opacity-60" />
                )}
                {b.ordineId && <Link href={`/m/acquisti/${encodeURIComponent(b.ordineId)}`}
                  className="h-12 rounded-xl bg-[#0E1B2C] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#1F3A68]">
                  <ShoppingCart size={18} /> Da acquistare
                </Link>}
              </div>
            )}
          </details>
        );
      })}
    </div>
  );
}
