"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FlaskConical } from "lucide-react";
import type { Campione, SchedaCompleta } from "@/types";
import { parseNumIt, formatEuro, totaleCampione, totaleSviluppo, VOCI_CAMPIONE } from "@/lib/utils";
import { SectionCard, EuroInput, numStr, inputCls, textareaCls } from "@/components/ui/Form";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  /** Il totale di sviluppo compare nel riepilogo della pagina, separato dal costo per capo. */
  onTotaleChange?: (totale: number, numero: number) => void;
}

const oggi = () => new Date().toISOString().slice(0, 10);
const nuovoId = () => Math.random().toString(36).slice(2, 10);

/**
 * Costi di sviluppo dell'articolo (studio modello, cartamodello, taglio e confezione del campione…).
 * Sono una spesa una tantum: non entrano mai nel costo per capo usato per preventivi e ordini.
 */
export default function TabCampioni({ scheda, onSave, onTotaleChange }: Props) {
  const [campioni, setCampioni] = useState<Campione[]>((scheda.campioni as Campione[]) || []);
  // Importi come li scrive l'utente ("12,5"), per non riformattarli mentre digita.
  const [importiStr, setImportiStr] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    ((scheda.campioni as Campione[]) || []).forEach((c) => c.voci.forEach((v, i) => { m[`${c.id}:${i}`] = numStr(v.importo); }));
    return m;
  });
  const [focus, setFocus] = useState<string | null>(null);

  const totale = totaleSviluppo(campioni);

  useEffect(() => {
    onTotaleChange?.(totale, campioni.length);
  }, [totale, campioni.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (focus) document.getElementById(focus)?.focus();
  }, [focus]);

  const salva = (lista: Campione[] = campioni) => onSave({ campioni: lista });

  const aggiorna = (lista: Campione[], persisti = false) => {
    setCampioni(lista);
    if (persisti) salva(lista);
  };

  const aggiungiCampione = () => {
    const c: Campione = { id: nuovoId(), nome: `${campioni.length + 1}° campione`, data: oggi(), voci: [] };
    aggiorna([...campioni, c], true);
  };

  const rimuoviCampione = (id: string) => {
    const c = campioni.find((x) => x.id === id);
    if (c && c.voci.length > 0 && !confirm(`Eliminare "${c.nome}" e le sue ${c.voci.length} voci di costo?`)) return;
    aggiorna(campioni.filter((x) => x.id !== id), true);
  };

  const modificaCampione = (id: string, patch: Partial<Campione>) =>
    aggiorna(campioni.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const aggiungiVoce = (id: string, descrizione = "") => {
    const c = campioni.find((x) => x.id === id)!;
    const idx = c.voci.length;
    aggiorna(campioni.map((x) => (x.id === id ? { ...x, voci: [...x.voci, { descrizione, importo: 0 }] } : x)));
    setFocus(descrizione ? `camp-${id}-imp-${idx}` : `camp-${id}-desc-${idx}`);
  };

  const rimuoviVoce = (id: string, idx: number) => {
    const lista = campioni.map((c) => (c.id === id ? { ...c, voci: c.voci.filter((_, i) => i !== idx) } : c));
    // Gli importi scritti sono indicizzati per posizione: riallineo quelli successivi.
    setImportiStr((prev) => {
      const next = { ...prev };
      const voci = campioni.find((c) => c.id === id)!.voci;
      for (let i = idx; i < voci.length; i++) {
        if (i + 1 < voci.length) next[`${id}:${i}`] = prev[`${id}:${i + 1}`] ?? numStr(voci[i + 1].importo);
        else delete next[`${id}:${i}`];
      }
      return next;
    });
    aggiorna(lista, true);
  };

  const modificaVoce = (id: string, idx: number, patch: { descrizione?: string; importoRaw?: string }) => {
    if (patch.importoRaw !== undefined) setImportiStr((p) => ({ ...p, [`${id}:${idx}`]: patch.importoRaw! }));
    aggiorna(campioni.map((c) => c.id !== id ? c : {
      ...c,
      voci: c.voci.map((v, i) => i !== idx ? v : {
        descrizione: patch.descrizione ?? v.descrizione,
        importo: patch.importoRaw !== undefined ? (parseNumIt(patch.importoRaw) ?? 0) : v.importo,
      }),
    }));
  };

  const lascia = () => { setFocus(null); salva(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Campioni e sviluppo</h2>
        <span className="flex items-center gap-1.5 text-[13px] text-[#1F3A68] bg-[#E3E9F3] px-3 py-1.5 rounded-lg">
          <FlaskConical size={14} /> Non entra nel costo per capo
        </span>
      </div>
      <p className="text-sm text-[#4A5566] -mt-2">
        Quanto è costato arrivare al modello giusto: studio, cartamodello, taglio e confezione dei campioni.
        È una spesa una tantum dell&apos;articolo, tenuta fuori dai costi di produzione e dai margini.
      </p>

      {campioni.map((c) => {
        const tot = totaleCampione(c);
        return (
          <SectionCard key={c.id} title={c.nome || "Campione"}
            action={<span className="font-mono text-[15px] font-semibold text-[#1F3A68]">{formatEuro(tot)}</span>}>
            <div className="grid grid-cols-[minmax(0,1fr)_170px_44px] gap-2.5 mb-4">
              <input type="text" value={c.nome} aria-label="Nome del campione"
                onChange={(e) => modificaCampione(c.id, { nome: e.target.value })} onBlur={lascia}
                placeholder="es. 2° campione — manica corretta" className={inputCls} />
              <input type="date" value={c.data} aria-label="Data del campione"
                onChange={(e) => modificaCampione(c.id, { data: e.target.value })} onBlur={lascia} className={inputCls} />
              <button type="button" onClick={() => rimuoviCampione(c.id)} aria-label={`Elimina ${c.nome}`}
                className="w-11 h-11 rounded-[10px] text-[#5F6878] hover:text-red-700 hover:bg-red-50 flex items-center justify-center">
                <Trash2 size={17} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-[#5F6878] mr-1">Rapidi</span>
              {VOCI_CAMPIONE.map((v) => (
                <button key={v} type="button" onClick={() => aggiungiVoce(c.id, v)}
                  className="h-9 px-3 rounded-full border border-[#D6D1C4] bg-[#FBFAF7] text-[13px] text-[#0E1B2C] hover:border-[#0E1B2C]/40">
                  + {v}
                </button>
              ))}
            </div>

            {c.voci.map((v, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_170px_44px] gap-2.5 items-center border-t border-[#EFEBE2] py-1.5">
                <input id={`camp-${c.id}-desc-${i}`} type="text" value={v.descrizione} aria-label="Voce di costo"
                  onChange={(e) => modificaVoce(c.id, i, { descrizione: e.target.value })} onBlur={lascia}
                  placeholder="es. Taglio campione" className={inputCls} />
                <EuroInput id={`camp-${c.id}-imp-${i}`} label={`Importo ${v.descrizione || "voce"}`}
                  value={importiStr[`${c.id}:${i}`] ?? numStr(v.importo || null)}
                  onChange={(raw) => modificaVoce(c.id, i, { importoRaw: raw })} onBlur={lascia} />
                <button type="button" onClick={() => rimuoviVoce(c.id, i)} aria-label={`Rimuovi ${v.descrizione || "voce"}`}
                  className="w-11 h-11 rounded-[10px] text-[#5F6878] hover:text-red-700 hover:bg-red-50 flex items-center justify-center">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => aggiungiVoce(c.id)}
              className="mt-1 h-11 px-2 flex items-center gap-1.5 text-sm font-semibold text-[#1F3A68]">
              <Plus size={16} /> Altra voce
            </button>

            <textarea value={c.note || ""} onChange={(e) => modificaCampione(c.id, { note: e.target.value })} onBlur={lascia}
              rows={2} placeholder="Note: cosa è cambiato, cosa va corretto, costi ancora da ricevere…" aria-label={`Note ${c.nome}`}
              className={`${textareaCls} mt-3`} />
          </SectionCard>
        );
      })}

      <div className="flex items-center justify-between gap-3 bg-white border border-dashed border-[#C9C3B5] rounded-2xl p-4">
        <button type="button" onClick={aggiungiCampione}
          className="h-11 px-4 rounded-[10px] bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> {campioni.length === 0 ? "Registra il primo campione" : "Nuovo campione"}
        </button>
        {campioni.length > 0 && (
          <span className="text-sm text-[#4A5566]">
            Totale sviluppo <span className="font-mono font-semibold text-[#0E1B2C] ml-1">{formatEuro(totale)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
