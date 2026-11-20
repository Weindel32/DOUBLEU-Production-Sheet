"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { parseNumIt, formatEuro } from "@/lib/utils";
import type { ConsumoMateriale } from "@/types";

/** Un consumo con materiale noto: `indice` è la sua posizione nei consumi salvati. */
type Riga = { indice: number; nome: string; unita: string; unitario: number };
type Fasonista = { taglio: number | null; cucitura: number | null; stampa: number | null; ricamo: number | null };

const VOCI_FASONISTA: { k: keyof Fasonista; label: string }[] = [
  { k: "taglio", label: "Taglio" },
  { k: "cucitura", label: "Cucitura / confezione" },
  { k: "stampa", label: "Stampa" },
  { k: "ricamo", label: "Ricamo" },
];

const testo = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/**
 * Dal telefono si cambiano solo consumi (quantità per capo) e prezzi del fasonista: il resto della scheda
 * si modifica dal computer. Il prezzo del tessuto vive nel materiale ("Aggiorna un prezzo").
 */
export default function ModificaCosti({ schedaId, consumi, righe, fasonista }: {
  schedaId: string;
  /** Tutti i consumi salvati, nello stesso ordine: si riscrivono interi cambiando solo la quantità. */
  consumi: ConsumoMateriale[];
  righe: Riga[];
  fasonista: Fasonista;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [qta, setQta] = useState<string[]>(() => consumi.map((c) => testo(c.consumoPerCapo)));
  const [lav, setLav] = useState<Record<keyof Fasonista, string>>(() => ({
    taglio: testo(fasonista.taglio), cucitura: testo(fasonista.cucitura), stampa: testo(fasonista.stampa), ricamo: testo(fasonista.ricamo),
  }));
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const annulla = () => {
    setQta(consumi.map((c) => testo(c.consumoPerCapo)));
    setLav({ taglio: testo(fasonista.taglio), cucitura: testo(fasonista.cucitura), stampa: testo(fasonista.stampa), ricamo: testo(fasonista.ricamo) });
    setErrore(null);
    setAperto(false);
  };

  const salva = async () => {
    const valori = qta.map((v) => parseNumIt(v));
    if (valori.some((v, i) => qta[i].trim() !== "" && (v === null || v < 0))) { setErrore("Un consumo non è un numero valido"); return; }
    const costi = Object.fromEntries(VOCI_FASONISTA.map(({ k }) => [k, parseNumIt(lav[k])])) as Fasonista;
    if (VOCI_FASONISTA.some(({ k }) => lav[k].trim() !== "" && (costi[k] === null || costi[k]! < 0))) { setErrore("Un prezzo non è un numero valido"); return; }
    setSalvando(true);
    setErrore(null);
    const totale = VOCI_FASONISTA.reduce((t, { k }) => t + (costi[k] ?? 0), 0);
    const res = await fetch(`/api/schede/${schedaId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumoMateriale: consumi.map((c, i) => ({ ...c, consumoPerCapo: valori[i] ?? 0 })),
        costoTaglio: costi.taglio, costoCucitura: costi.cucitura, costoStampa: costi.stampa, costoRicamo: costi.ricamo,
        costoLavorazione: totale || null,
      }),
    }).catch(() => null);
    setSalvando(false);
    if (!res?.ok) { setErrore("Non salvato: riprova"); return; }
    setAperto(false);
    router.refresh();
  };

  if (!aperto)
    return (
      <button type="button" onClick={() => setAperto(true)}
        className="w-full h-12 rounded-xl border border-[#1F3A68] bg-white text-[#1F3A68] text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#EEF2F8]">
        <Pencil size={17} /> Modifica consumi e prezzi fasonista
      </button>
    );

  const campo = "w-24 h-11 rounded-lg border border-[#D6D1C4] bg-white px-2.5 text-right font-mono text-[16px] focus:outline-none focus:border-[#1F3A68]";
  return (
    <section className="bg-white border border-[#1F3A68] rounded-2xl overflow-hidden">
      <h2 className="px-4 py-3 border-b border-[#EFEBE2] font-display font-bold text-[16px]">Modifica consumi e prezzi fasonista</h2>

      {righe.length > 0 && (
        <div className="divide-y divide-[#EFEBE2]">
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#5F6878]">Consumo per capo</div>
          {righe.map((r) => {
            const i = r.indice;
            return (
              <label key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium truncate">{r.nome}</span>
                  <span className="block text-[12px] text-[#5F6878] font-mono">{r.unitario > 0 ? `${formatEuro(r.unitario)}/${r.unita}` : "prezzo mancante"}</span>
                </span>
                <input inputMode="decimal" value={qta[i]} onChange={(e) => setQta((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                  aria-label={`Consumo ${r.nome}`} className={campo} />
                <span className="w-6 text-[13px] text-[#5F6878]">{r.unita}</span>
              </label>
            );
          })}
        </div>
      )}

      <div className="divide-y divide-[#EFEBE2] border-t border-[#EFEBE2]">
        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#5F6878]">Fasonista, € per capo</div>
        {VOCI_FASONISTA.map(({ k, label }) => (
          <label key={k} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex-1 text-[15px] font-medium">{label}</span>
            <input inputMode="decimal" value={lav[k]} onChange={(e) => setLav((p) => ({ ...p, [k]: e.target.value }))}
              placeholder="—" aria-label={`${label} € per capo`} className={campo} />
            <span className="w-6 text-[13px] text-[#5F6878]">€</span>
          </label>
        ))}
      </div>

      {errore && <p role="alert" className="px-4 pt-2 text-[13px] text-red-700">{errore}</p>}
      <div className="grid grid-cols-2 gap-2 p-3">
        <button type="button" onClick={annulla} disabled={salvando}
          className="h-12 rounded-xl border border-[#D6D1C4] text-[15px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <X size={17} /> Annulla
        </button>
        <button type="button" onClick={salva} disabled={salvando}
          className="h-12 rounded-xl bg-[#0E1B2C] text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Check size={17} /> {salvando ? "Salvo…" : "Salva"}
        </button>
      </div>
    </section>
  );
}
