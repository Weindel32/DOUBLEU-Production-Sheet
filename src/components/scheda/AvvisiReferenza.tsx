"use client";

import { useState } from "react";
import { Link2, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { nomeReferenza, type ReferenzaOrderApp } from "@/lib/orderApp";
import { statoReferenza, suggerisciReferenza, taglieDiverse, testoTaglie } from "@/lib/referenze";
import { calcolaTotaleQuantita } from "@/lib/utils";
import { inputCls } from "@/components/ui/Form";
import type { SchedaCompleta } from "@/types";

/**
 * In cima a una scheda di produzione legata a un ordine: a quale referenza dell'Order App corrisponde
 * e cosa è cambiato lì (nome, taglie). Niente si aggiorna da solo: ogni cambio è un tocco dell'utente.
 */
export default function AvvisiReferenza({ scheda, referenze, collegateAltrove, quantita, onSave }: {
  scheda: SchedaCompleta;
  /** null = ordine non letto ora (Order App irraggiungibile): niente avvisi. */
  referenze: ReferenzaOrderApp[] | null;
  /** Articoli già collegati ad altre schede dello stesso ordine: non si suggeriscono. */
  collegateAltrove: string[];
  quantita: Record<string, number>;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
}) {
  const [articoloId, setArticoloId] = useState(scheda.articoloOrderAppId ?? null);
  const stato = statoReferenza(articoloId, referenze);
  const suggerita = referenze ? suggerisciReferenza(scheda, referenze, new Set(collegateAltrove)) : undefined;
  const [scelta, setScelta] = useState(suggerita?.id ?? "");
  const [inCorso, setInCorso] = useState(false);

  if (stato.tipo === "nessuno" || !referenze) return null;

  const collega = async () => {
    if (!scelta) return;
    setInCorso(true);
    await onSave({ articoloOrderAppId: scelta });
    setArticoloId(scelta);
    setInCorso(false);
  };
  // Nome e taglie vivono anche in intestazione e in "Misure e quantità": si ricarica la pagina per allinearli.
  const applica = async (data: Partial<SchedaCompleta>) => {
    setInCorso(true);
    await onSave(data);
    window.location.reload();
  };

  const bottone = "h-10 px-3.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50";

  if (stato.tipo === "da-collegare" || stato.tipo === "non-piu-nell-ordine") {
    const perso = stato.tipo === "non-piu-nell-ordine";
    return (
      <div role={perso ? "alert" : undefined}
        className={`rounded-2xl border px-5 py-3.5 space-y-2.5 ${perso ? "border-[#E8B4A0] bg-[#FBEDE5]" : "border-[#C9D5E8] bg-[#EEF2F8]"}`}>
        <p className={`text-sm flex items-start gap-2 ${perso ? "text-[#A8461F]" : "text-[#1F3A68]"}`}>
          {perso ? <AlertTriangle size={17} className="mt-0.5 flex-shrink-0" /> : <Link2 size={17} className="mt-0.5 flex-shrink-0" />}
          <span>
            {perso
              ? <><strong>Non più nell&apos;ordine</strong>: la referenza a cui era collegata è stata tolta o sostituita nell&apos;Order App. Resta fuori dagli acquisti finché non la ricolleghi o la elimini.</>
              : <><strong>Collega la scheda alla sua referenza</strong>: nome, capi e taglie arriveranno dall&apos;ordine.</>}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={scelta} onChange={(e) => setScelta(e.target.value)} aria-label="Referenza dell'ordine" className={`${inputCls} !w-auto min-w-[260px] flex-1 max-w-md`}>
            <option value="">Scegli la referenza…</option>
            {referenze.map((r) => (
              <option key={r.id} value={r.id}>
                {nomeReferenza(r)}{r.kit ? ` · ${r.kit}` : ""}{r.capi ? ` · ${r.capi} capi` : ""}
                {r.ids.some((id) => collegateAltrove.includes(id)) ? " · già usata" : ""}
              </option>
            ))}
          </select>
          <button type="button" onClick={collega} disabled={!scelta || inCorso}
            className={`${bottone} bg-[#0E1B2C] text-white hover:bg-[#1F3A68]`}>
            <Link2 size={15} /> {perso ? "Ricollega" : "Collega"}
          </button>
          {suggerita && scelta === suggerita.id && <span className="text-xs text-[#5F6878]">suggerita per nome o categoria</span>}
        </div>
      </div>
    );
  }

  // Collegata: cosa è cambiato nell'ordine rispetto alla scheda.
  const r = stato.referenza;
  const nome = nomeReferenza(r);
  const proprie = calcolaTotaleQuantita(quantita);
  const avvisi: React.ReactNode[] = [];

  if (nome && nome !== scheda.nomeArticolo)
    avvisi.push(
      <div key="nome" className="flex flex-wrap items-center justify-between gap-2">
        <span>Nell&apos;ordine ora si chiama <strong>{nome}</strong> (qui: {scheda.nomeArticolo}).</span>
        <button type="button" onClick={() => applica({ nomeArticolo: nome })} disabled={inCorso} className={`${bottone} border border-[#1F3A68] text-[#1F3A68] hover:bg-[#1F3A68] hover:text-white`}>
          <RefreshCw size={14} /> Aggiorna nome
        </button>
      </div>,
    );
  if (r.taglie && taglieDiverse(quantita, r.taglie))
    avvisi.push(
      <div key="taglie" className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {proprie > 0 ? "Le taglie nell'ordine sono diverse" : "Sono arrivate le taglie"}: <strong>{testoTaglie(r.taglie)}</strong> ({r.capi} capi)
          {proprie > 0 && <> · qui {testoTaglie(quantita)} ({proprie} capi)</>}.
        </span>
        <button type="button" onClick={() => applica({ quantitaTaglia: r.taglie! })} disabled={inCorso} className={`${bottone} bg-[#0E1B2C] text-white hover:bg-[#1F3A68]`}>
          <RefreshCw size={14} /> Usa le taglie dell&apos;ordine
        </button>
      </div>,
    );
  else if (!r.taglie && r.capi && proprie === 0)
    avvisi.push(<span key="stima">Taglie non ancora arrivate: costi e tessuto sono calcolati sui <strong>{r.capi} capi</strong> dell&apos;ordine (stima).</span>);
  else if (!r.taglie && r.capi && proprie > 0 && proprie !== r.capi)
    avvisi.push(<span key="diff">Qui ci sono <strong>{proprie} capi</strong>, nell&apos;ordine <strong>{r.capi}</strong>: le taglie del club non sono ancora arrivate.</span>);

  return (
    <div className="rounded-2xl border border-[#C9D5E8] bg-[#EEF2F8] px-5 py-3 text-sm text-[#1F3A68] space-y-2">
      <div className="flex items-center gap-2 text-[13px]">
        <Info size={15} className="flex-shrink-0" />
        <span>Referenza dell&apos;ordine: <strong>{nome}</strong>{r.kit ? ` · ${r.kit}` : ""}{r.capi ? ` · ${r.capi} capi` : ""}</span>
        <button type="button" onClick={() => { setScelta(r.id); setArticoloId(null); }} className="ml-auto text-xs underline underline-offset-2 hover:text-[#0E1B2C]">
          Cambia
        </button>
      </div>
      {avvisi.length > 0 && <div className="space-y-2 border-t border-[#C9D5E8] pt-2">{avvisi}</div>}
    </div>
  );
}
