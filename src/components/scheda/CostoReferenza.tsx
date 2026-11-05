"use client";

import { Lock } from "lucide-react";
import { formatEuro, MARGINE_MINIMO, MARGINE_PIENO } from "@/lib/utils";
import type { VoceCosto } from "./TabProduzione";

interface Props {
  voci: VoceCosto[];
  pezzi: number;
  /** Pezzi presi dall'ordine perché la scheda non ha ancora le taglie. */
  stimati: boolean;
  prezzoVendita: number;
  /** Fasonista della scheda: va accanto alla confezione. */
  produttore: string;
  onVaiAiCosti: () => void;
}

const COLS = "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_52px] gap-3 items-baseline";

/**
 * Costo previsto della referenza: costo per capo di ogni voce × pezzi.
 * È il previsto, non lo speso: le spese reali stanno sull'ordine (consuntivo dell'ordine).
 */
export default function CostoReferenza({ voci, pezzi, stimati, prezzoVendita, produttore, onVaiAiCosti }: Props) {
  const costoCapo = voci.reduce((t, v) => t + v.perCapo, 0);
  const totale = costoCapo * pezzi;
  const ricavo = prezzoVendita > 0 ? prezzoVendita * pezzi : 0;
  const margine = ricavo > 0 && totale > 0 ? ricavo - totale : null;
  const marginePct = margine !== null ? (margine / ricavo) * 100 : null;
  const mancanti = voci.filter((v) => v.manca);
  const coloreMargine = marginePct === null ? "text-[#5F6878]"
    : marginePct >= MARGINE_PIENO ? "text-[#1D6B4A]" : marginePct >= MARGINE_MINIMO ? "text-[#7A5B12]" : "text-[#A8461F]";

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4E0D6] flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-title">Costo della referenza</h3>
        <span className="flex items-center gap-3 text-xs">
          {pezzi > 0 && <span className="text-[#1F3A68] font-semibold">{pezzi} pz{stimati && " stimati dall'ordine"}</span>}
          <span className="flex items-center gap-1 text-[#A8461F]"><Lock size={12} /> solo interno</span>
        </span>
      </div>

      {pezzi === 0 ? (
        <p className="px-4 py-4 text-sm text-[#5F6878]">Inserisci le quantità per taglia: il costo di ogni voce si calcola sui pezzi della referenza.</p>
      ) : voci.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[#5F6878]">
          Nessun costo inserito.{" "}
          <button type="button" onClick={onVaiAiCosti} className="font-semibold text-[#1F3A68] underline underline-offset-2">Vai ai costi</button>
        </p>
      ) : (
        <div className="px-4 py-3">
          <div className={`${COLS} text-xs text-[#5F6878] pb-1.5`}>
            <span>Voce</span><span className="text-right">Quantità</span><span className="text-right">€ / capo</span><span className="text-right">Totale</span><span className="text-right">%</span>
          </div>
          {voci.map((v, i) => {
            const dettaglio = v.fase === "Confezione" ? produttore || "fasonista non indicato" : v.dettaglio;
            const tot = v.perCapo * pezzi;
            return (
              <div key={`${v.fase}${v.nome}${i}`} className={`${COLS} border-t border-[#EFEBE2] py-2 text-sm`}>
                <span className="min-w-0">
                  <span className="font-medium text-[#0E1B2C]">{v.nome}</span>
                  {v.fase === "Tessuto" && <span className="text-xs text-[#5F6878]"> · materiale</span>}
                  {dettaglio && <span className="block text-xs text-[#5F6878] truncate" title={dettaglio}>{dettaglio}</span>}
                </span>
                <span className="text-right font-mono text-[13px] text-[#4A5566]">{v.quantita ?? `${pezzi} pz`}</span>
                <span className="text-right font-mono text-[13px] text-[#4A5566]">
                  {v.manca && v.perCapo <= 0 ? <span className="text-[#A8461F]">manca</span> : formatEuro(v.perCapo)}
                </span>
                <span className="text-right font-mono font-semibold text-[#0E1B2C]">{v.manca && v.perCapo <= 0 ? "—" : formatEuro(tot)}</span>
                <span className="text-right font-mono text-xs text-[#5F6878]">{totale > 0 && tot > 0 ? `${Math.round((tot / totale) * 100)}%` : ""}</span>
              </div>
            );
          })}

          <div className={`${COLS} border-t-2 border-[#E4E0D6] pt-2.5 mt-1 text-sm`}>
            <span className="font-semibold text-[#0E1B2C]">Costo totale</span>
            <span />
            <span className="text-right font-mono text-[13px] text-[#4A5566]">{formatEuro(costoCapo)}</span>
            <span className="text-right font-mono text-[15px] font-bold text-[#0E1B2C]">{formatEuro(totale)}</span>
            <span />
          </div>
          <div className={`${COLS} pt-1.5 text-sm`}>
            <span className="text-[#4A5566]">Ricavo</span>
            <span />
            <span className="text-right font-mono text-[13px] text-[#4A5566]">{prezzoVendita > 0 ? formatEuro(prezzoVendita) : "—"}</span>
            <span className="text-right font-mono font-semibold text-[#0E1B2C]">{ricavo > 0 ? formatEuro(ricavo) : "—"}</span>
            <span />
          </div>
          <div className={`${COLS} pt-1.5 text-sm`}>
            <span className="text-[#4A5566]">Margine</span>
            <span />
            <span className="text-right font-mono text-[13px] text-[#4A5566]">{margine !== null ? formatEuro(margine / pezzi) : "—"}</span>
            <span className={`text-right font-mono font-semibold ${coloreMargine}`}>{margine !== null ? formatEuro(margine) : "—"}</span>
            <span className={`text-right font-mono text-xs font-semibold ${coloreMargine}`}>{marginePct !== null ? `${marginePct.toFixed(1).replace(".", ",")}%` : ""}</span>
          </div>

          <p className="text-xs text-[#5F6878] mt-3 leading-snug">
            Previsto dai costi della scheda, materiali al netto dello scarto. Lo speso reale si registra nel consuntivo dell&apos;ordine.
            {mancanti.length > 0 && <span className="text-[#A8461F]"> Costo da completare: {mancanti.map((v) => v.nome).join(", ")}.</span>}
            {prezzoVendita <= 0 && <span className="text-[#A8461F]"> Manca il prezzo di vendita.</span>}
          </p>
        </div>
      )}
    </div>
  );
}
