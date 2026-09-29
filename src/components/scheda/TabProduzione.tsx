"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, Trash2, Upload, Lock } from "lucide-react";
import type { SchedaCompleta, ConsumoMateriale, Accessorio } from "@/types";
import {
  calcolaTotaleQuantita, parseNumIt, calcolaKgPerMetroLineare, calcolaCostoUnitarioConsumo,
  calcolaRiepilogoCosti, prezzoDaMargine, formatEuro, type RiepilogoCosti,
} from "@/lib/utils";
import { Field, SectionCard, EuroInput, numStr, inputCls, textareaCls } from "@/components/ui/Form";

interface MaterialeDisp {
  id: string;
  nome: string;
  tipo: string;
  costoMetro: number | null;
  prezzoKg: number | null;
  unitaMisura: string | null;
  peso: string | null;
  unitaPeso: string | null;
  larghezza: string | null;
}

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  materialiDisponibili: MaterialeDisp[];
  /** Articolo di costo: solo costi, niente note di produzione, tolleranze e allegati. */
  soloCosti?: boolean;
  /** Il riepilogo vive nel riquadro fisso della pagina: gli passo i numeri a ogni modifica. */
  onRiepilogoChange?: (r: RiepilogoCosti) => void;
}

export interface TabProduzioneHandle {
  save: () => Promise<void>;
}

const parseNum = parseNumIt;

const ACCESSORI_RAPIDI = ["Zip", "Laccio", "Etichetta", "Puntali", "Bottone", "Elastico"];
const MARGINI_OBIETTIVO = [35, 45, 55];

// Colonne condivise da intestazione e righe di materiali e accessori.
const RIGA_COLS = "grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_44px] gap-2.5 items-center";

const TabProduzione = forwardRef<TabProduzioneHandle, Props>(function TabProduzione(
  { scheda, onSave, materialiDisponibili, soloCosti, onRiepilogoChange }, ref,
) {
  const [noteProduzione, setNoteProduzione] = useState(scheda.noteProduzione || "");
  const [tolleranzaTaglio, setTolleranzaTaglio] = useState(scheda.tolleranzaTaglio || "");
  const [tolleranzaCucitura, setTolleranzaCucitura] = useState(scheda.tolleranzaCucitura || "");
  const [tolleranzaColore, setTolleranzaColore] = useState(scheda.tolleranzaColore || "");
  const [tolleranzaStampa, setTolleranzaStampa] = useState(scheda.tolleranzaStampa || "");
  const [controlloQualita, setControlloQualita] = useState(scheda.controlloQualita || "");
  const [packaging, setPackaging] = useState(scheda.packaging || "");
  const [consumi, setConsumi] = useState<ConsumoMateriale[]>(
    (scheda.consumoMateriale as ConsumoMateriale[]) || []
  );
  const [consumiStr, setConsumiStr] = useState<string[]>(
    ((scheda.consumoMateriale as ConsumoMateriale[]) || []).map((c) => numStr(c.consumoPerCapo))
  );
  const [accessori, setAccessori] = useState<Accessorio[]>((scheda.accessori as Accessorio[]) || []);
  const [accessoriStr, setAccessoriStr] = useState<{ quantita: string; prezzo: string }[]>(
    ((scheda.accessori as Accessorio[]) || []).map((a) => ({ quantita: numStr(a.quantita), prezzo: numStr(a.prezzoUnitario) }))
  );
  const [costoTaglio, setCostoTaglio] = useState(numStr(scheda.costoTaglio));
  const [costoCucitura, setCostoCucitura] = useState(numStr(scheda.costoCucitura));
  const [costoStampa, setCostoStampa] = useState(numStr(scheda.costoStampa));
  const [costoRicamo, setCostoRicamo] = useState(numStr(scheda.costoRicamo));
  const [prezzoVendita, setPrezzoVendita] = useState(numStr(scheda.prezzoVendita));
  const [margineObiettivo, setMargineObiettivo] = useState(45);
  const [focusAcc, setFocusAcc] = useState<string | null>(null);

  const quantitaTaglia = (scheda.quantitaTaglia as Record<string, number>) || {};
  const totalePezzi = soloCosti ? 0 : calcolaTotaleQuantita(quantitaTaglia);

  // Dopo "+ Zip" il cursore va dritto sul prezzo (l'unico dato che manca); dopo "Altro" sul nome.
  useEffect(() => {
    if (focusAcc) document.getElementById(focusAcc)?.focus();
  }, [focusAcc]);

  /**
   * Salva tutto. Le liste appena modificate si passano esplicitamente: lo stato React
   * si aggiorna solo al render successivo, e salvare quello vecchio rimetterebbe
   * in scheda una riga appena eliminata.
   */
  const salva = async (over: { consumi?: ConsumoMateriale[]; accessori?: Accessorio[]; prezzoVendita?: string } = {}) => {
    const lav = [costoTaglio, costoCucitura, costoStampa, costoRicamo].map((v) => parseNum(v) ?? 0);
    const costoLavorazione = lav.reduce((a, b) => a + b, 0);

    const consumiAggiornati = (over.consumi ?? consumi).map((c) => {
      const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
      return { ...c, costoUnitario: calcolaCostoUnitarioConsumo(mat) };
    });

    await onSave({
      noteProduzione, tolleranzaTaglio, tolleranzaCucitura, tolleranzaColore,
      tolleranzaStampa, controlloQualita, packaging,
      consumoMateriale: consumiAggiornati,
      accessori: over.accessori ?? accessori,
      costoTaglio: parseNum(costoTaglio),
      costoCucitura: parseNum(costoCucitura),
      costoStampa: parseNum(costoStampa),
      costoRicamo: parseNum(costoRicamo),
      costoLavorazione: costoLavorazione || null,
      prezzoVendita: parseNum(over.prezzoVendita ?? prezzoVendita),
    });
  };

  useImperativeHandle(ref, () => ({ save: () => salva() }));

  // ── Materiali ────────────────────────────────────────────
  const aggiungiConsumo = () => {
    if (materialiDisponibili.length === 0) return;
    const m = materialiDisponibili[0];
    setConsumi((prev) => [...prev, {
      materialeId: m.id, nomeM: m.nome, consumoPerCapo: 0, unita: m.unitaMisura === "pz" ? "pz" : "m",
      costoUnitario: calcolaCostoUnitarioConsumo(m),
    }]);
    setConsumiStr((prev) => [...prev, ""]);
  };

  const rimuoviConsumo = (idx: number) => {
    const nuovi = consumi.filter((_, i) => i !== idx);
    setConsumi(nuovi);
    setConsumiStr((prev) => prev.filter((_, i) => i !== idx));
    salva({ consumi: nuovi });
  };

  const cambiaMateriale = (idx: number, materialeId: string) => {
    const m = materialiDisponibili.find((x) => x.id === materialeId);
    const nuovi = consumi.map((c, i) => i !== idx ? c : {
      ...c, materialeId, nomeM: m?.nome || "", unita: m?.unitaMisura === "pz" ? "pz" : "m",
      costoUnitario: calcolaCostoUnitarioConsumo(m),
    });
    setConsumi(nuovi);
    salva({ consumi: nuovi });
  };

  const aggiornaConsumoStr = (idx: number, raw: string) => {
    setConsumiStr((prev) => prev.map((s, i) => i === idx ? raw : s));
    const n = parseNum(raw);
    setConsumi((prev) => prev.map((c, i) => i === idx ? { ...c, consumoPerCapo: n ?? 0 } : c));
  };

  // ── Accessori ────────────────────────────────────────────
  const aggiungiAccessorio = (nome = "") => {
    const idx = accessori.length;
    setAccessori((prev) => [...prev, { nome, quantita: 1, prezzoUnitario: 0 }]);
    setAccessoriStr((prev) => [...prev, { quantita: "1", prezzo: "" }]);
    setFocusAcc(nome ? `acc-prezzo-${idx}` : `acc-nome-${idx}`);
  };

  const rimuoviAccessorio = (idx: number) => {
    const nuovi = accessori.filter((_, i) => i !== idx);
    setAccessori(nuovi);
    setAccessoriStr((prev) => prev.filter((_, i) => i !== idx));
    setFocusAcc(null);
    salva({ accessori: nuovi });
  };

  const aggiornaAccessorio = (idx: number, patch: Partial<Accessorio>) =>
    setAccessori((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const aggiornaAccessorioStr = (idx: number, field: "quantita" | "prezzo", raw: string) => {
    setAccessoriStr((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: raw } : s)));
    const n = parseNum(raw) ?? 0;
    aggiornaAccessorio(idx, field === "quantita" ? { quantita: n } : { prezzoUnitario: n });
  };

  const lasciaAccessorio = () => { setFocusAcc(null); salva(); };

  // ── Riepilogo ────────────────────────────────────────────
  const riepilogo = calcolaRiepilogoCosti(
    {
      consumi,
      accessori,
      lavorazioni: [costoTaglio, costoCucitura, costoStampa, costoRicamo].map((v) => parseNum(v)),
      prezzoVendita: parseNum(prezzoVendita),
    },
    materialiDisponibili,
  );

  useEffect(() => {
    onRiepilogoChange?.(riepilogo);
    // Dipendo dai numeri, non dall'oggetto (nuovo a ogni render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riepilogo.materiali, riepilogo.accessori, riepilogo.lavorazioni, riepilogo.prezzoVendita]);

  const prezzoSuggerito = riepilogo.totale > 0 ? prezzoDaMargine(riepilogo.totale, margineObiettivo) : 0;

  const usaPrezzoSuggerito = () => {
    const v = prezzoSuggerito.toFixed(2).replace(".", ",");
    setPrezzoVendita(v);
    salva({ prezzoVendita: v });
  };

  const margineColore = riepilogo.margine === null ? "text-[#5F6878]"
    : riepilogo.margine >= 40 ? "text-[#1D6B4A]" : riepilogo.margine >= 30 ? "text-[#7A5B12]" : "text-[#A8461F]";

  const lavorazioni = [
    { label: "Taglio", value: costoTaglio, set: setCostoTaglio },
    { label: "Cucitura", value: costoCucitura, set: setCostoCucitura },
    { label: "Stampa", value: costoStampa, set: setCostoStampa },
    { label: "Ricamo", value: costoRicamo, set: setCostoRicamo },
  ];

  const subtotale = (n: number) => (
    <span className="font-mono text-[15px] font-semibold text-[#A8461F]">{formatEuro(n)} / capo</span>
  );

  return (
    <div className="space-y-4">
      {/* ── Costi interni ───────────────────────────────── */}
      <div id="sez-costi" className="scheda-section space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Costi interni</h2>
          <span className="flex items-center gap-1.5 text-[13px] text-[#A8461F] bg-[#FBEDE5] px-3 py-1.5 rounded-lg">
            <Lock size={14} /> Mai nel PDF produttore
          </span>
        </div>

        {/* Prezzo e margine a destra solo su schermi molto larghi; su iPad vanno sotto, affiancati */}
        <div className="grid gap-4 items-start min-[1600px]:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4 min-w-0">
            {/* Materiali */}
            <SectionCard title="Materiali" action={subtotale(riepilogo.materiali)}>
              {consumi.length > 0 && (
                <div className={`${RIGA_COLS} text-xs text-[#5F6878] pb-1.5`}>
                  <span>Materiale</span><span className="text-right">Consumo</span><span className="text-right">Prezzo</span><span className="text-right">€ / capo</span><span />
                </div>
              )}
              {consumi.map((c, i) => {
                const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
                const unitario = calcolaCostoUnitarioConsumo(mat);
                const isPz = mat?.unitaMisura === "pz";
                const isKg = mat?.unitaMisura === "kg";
                const kgPerM = mat ? calcolaKgPerMetroLineare(mat) : null;
                return (
                  <div key={i} className="border-t border-[#EFEBE2] py-1.5">
                    <div className={RIGA_COLS}>
                      <select value={c.materialeId} onChange={(e) => cambiaMateriale(i, e.target.value)} aria-label="Materiale" className={inputCls}>
                        {materialiDisponibili.map((m) => <option key={m.id} value={m.id}>{m.nome}{m.unitaMisura === "kg" ? " · al kg" : ""}</option>)}
                      </select>
                      <span className="flex items-center gap-1 h-11 border border-[#D6D1C4] rounded-[10px] bg-white px-3 focus-within:border-[#1F3A68]">
                        <input
                          type="text" inputMode="decimal" aria-label={`Consumo per capo in ${isPz ? "pezzi" : "metri"}`}
                          value={consumiStr[i] ?? ""} onChange={(e) => aggiornaConsumoStr(i, e.target.value)} onBlur={() => salva()}
                          placeholder="0" className="w-full min-w-0 border-0 !shadow-none bg-transparent p-0 text-right font-mono text-[15px]"
                        />
                        <span className="text-[#5F6878] text-sm">{isPz ? "pz" : "m"}</span>
                      </span>
                      <span className="text-right font-mono text-sm text-[#4A5566]">
                        {unitario > 0 ? `${formatEuro(unitario)}/${isPz ? "pz" : "m"}` : <span className="text-[#A8461F]">manca</span>}
                      </span>
                      <span className="text-right font-mono text-[15px] font-semibold">{formatEuro((c.consumoPerCapo || 0) * unitario)}</span>
                      <button type="button" onClick={() => rimuoviConsumo(i)} aria-label={`Rimuovi ${c.nomeM || "materiale"}`}
                        className="w-11 h-11 rounded-[10px] text-[#5F6878] hover:text-red-700 hover:bg-red-50 flex items-center justify-center">
                        <Trash2 size={17} />
                      </button>
                    </div>
                    {isKg && c.consumoPerCapo > 0 && (
                      <div className="text-xs text-[#5F6878] mt-1">
                        {kgPerM === null
                          ? <span className="text-[#A8461F]">Inserisci peso e altezza nel materiale per il costo al metro</span>
                          : totalePezzi > 0 && `${(totalePezzi * c.consumoPerCapo * kgPerM).toFixed(1)} kg per l'ordine`}
                      </div>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={aggiungiConsumo} disabled={materialiDisponibili.length === 0}
                className="mt-1 h-11 px-2 flex items-center gap-1.5 text-sm font-semibold text-[#1F3A68] disabled:opacity-40">
                <Plus size={16} /> Aggiungi materiale
              </button>
              {materialiDisponibili.length === 0 && (
                <p className="text-sm text-[#5F6878]">Nessun materiale in anagrafica: aggiungilo da Materiali.</p>
              )}
            </SectionCard>

            {/* Accessori */}
            <SectionCard title="Accessori" action={subtotale(riepilogo.accessori)}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-[#5F6878] mr-1">Rapidi</span>
                {ACCESSORI_RAPIDI.map((nome) => (
                  <button key={nome} type="button" onClick={() => aggiungiAccessorio(nome)}
                    className="h-9 px-3 rounded-full border border-[#D6D1C4] bg-[#FBFAF7] text-[13px] text-[#0E1B2C] hover:border-[#0E1B2C]/40">
                    + {nome}
                  </button>
                ))}
              </div>
              {accessori.length > 0 && (
                <div className={`${RIGA_COLS} text-xs text-[#5F6878] pb-1.5`}>
                  <span>Accessorio</span><span className="text-right">Pz / capo</span><span className="text-right">€ unitario</span><span className="text-right">€ / capo</span><span />
                </div>
              )}
              {accessori.map((a, i) => (
                <div key={i} className={`${RIGA_COLS} border-t border-[#EFEBE2] py-1.5`}>
                  <input id={`acc-nome-${i}`} type="text" value={a.nome} aria-label="Nome accessorio"
                    onChange={(e) => aggiornaAccessorio(i, { nome: e.target.value })} onBlur={lasciaAccessorio}
                    placeholder="es. Zip YKK 60 cm" className={inputCls} />
                  <input type="text" inputMode="decimal" aria-label="Pezzi per capo" value={accessoriStr[i]?.quantita ?? ""}
                    onChange={(e) => aggiornaAccessorioStr(i, "quantita", e.target.value)} onBlur={lasciaAccessorio}
                    placeholder="1" className={`${inputCls} text-right font-mono`} />
                  <EuroInput id={`acc-prezzo-${i}`} label="Prezzo unitario" value={accessoriStr[i]?.prezzo ?? ""}
                    onChange={(v) => aggiornaAccessorioStr(i, "prezzo", v)} onBlur={lasciaAccessorio} />
                  <span className="text-right font-mono text-[15px] font-semibold">{formatEuro((a.quantita || 0) * (a.prezzoUnitario || 0))}</span>
                  <button type="button" onClick={() => rimuoviAccessorio(i)} aria-label={`Rimuovi ${a.nome || "accessorio"}`}
                    className="w-11 h-11 rounded-[10px] text-[#5F6878] hover:text-red-700 hover:bg-red-50 flex items-center justify-center">
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => aggiungiAccessorio()}
                className="mt-1 h-11 px-2 flex items-center gap-1.5 text-sm font-semibold text-[#1F3A68]">
                <Plus size={16} /> Altro accessorio
              </button>
            </SectionCard>

            {/* Lavorazioni */}
            <SectionCard title="Lavorazioni" action={subtotale(riepilogo.lavorazioni)}>
              <div className="grid grid-cols-4 gap-3">
                {lavorazioni.map(({ label, value, set }) => (
                  <div key={label} className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
                    <span>{label}</span>
                    <EuroInput label={`Costo ${label.toLowerCase()} per capo`} value={value} onChange={set} onBlur={() => salva()} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Prezzo e margine */}
          <div className="grid grid-cols-2 gap-4 items-start min-[1600px]:grid-cols-1">
            <SectionCard title="Prezzo e margine">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
                  <span>Prezzo vendita / capo</span>
                  <EuroInput big label="Prezzo vendita per capo" value={prezzoVendita} onChange={setPrezzoVendita} onBlur={() => salva()} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#4A5566]">Margine</span>
                  <span className={`font-mono text-[28px] font-semibold ${margineColore}`}>
                    {riepilogo.margine === null ? "—" : `${riepilogo.margine.toFixed(1).replace(".", ",")}%`}
                  </span>
                </div>
                {riepilogo.margine !== null && (
                  <div aria-hidden className="relative h-2 rounded bg-[linear-gradient(90deg,#EFD2C3_0_50%,#EFE4C4_50%_66.6%,#CFE5D8_66.6%_100%)]">
                    <div className="absolute -top-1 w-1 h-4 rounded bg-[#0E1B2C]"
                      style={{ left: `calc(${Math.max(0, Math.min(60, riepilogo.margine)) / 60 * 100}% - 2px)` }} />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Prezzo da margine">
              <div className="space-y-3">
                <div role="group" aria-label="Margine obiettivo" className="flex gap-1.5">
                  {MARGINI_OBIETTIVO.map((m) => (
                    <button key={m} type="button" aria-pressed={m === margineObiettivo} onClick={() => setMargineObiettivo(m)}
                      className={`flex-1 h-10 rounded-lg border text-sm ${m === margineObiettivo ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C]"}`}>
                      {m}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#4A5566]">Prezzo suggerito</span>
                  <span className="font-mono text-xl font-semibold">{prezzoSuggerito > 0 ? formatEuro(prezzoSuggerito) : "—"}</span>
                </div>
                <button type="button" onClick={usaPrezzoSuggerito} disabled={prezzoSuggerito <= 0}
                  className="w-full h-11 rounded-[10px] border border-[#0E1B2C] bg-white text-sm font-semibold text-[#0E1B2C] hover:bg-[#0E1B2C] hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#0E1B2C]">
                  Usa questo prezzo
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Produzione ─────────────────────────────────── */}
      {!soloCosti && (
        <div id="sez-produzione" className="scheda-section space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0E1B2C] pt-2">Produzione</h2>
          <div className="grid grid-cols-2 gap-4">
            <SectionCard title="Note per il produttore">
              <textarea value={noteProduzione} onChange={(e) => setNoteProduzione(e.target.value)} onBlur={() => salva()}
                rows={6} placeholder="Istruzioni, attenzioni, riferimenti…" aria-label="Note per il produttore" className={textareaCls} />
            </SectionCard>

            <SectionCard title="Allegati">
              <div className="space-y-2 mb-3">
                {(scheda.allegati || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[#FBFAF7] rounded-lg text-sm text-[#4A5566]">
                    <div className="w-9 h-9 bg-[#E3E9F3] rounded flex items-center justify-center text-[#1F3A68] text-xs font-bold">
                      {a.split(".").pop()?.toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{a}</span>
                  </div>
                ))}
                {(scheda.allegati || []).length === 0 && <p className="text-sm text-[#5F6878]">Nessun allegato.</p>}
              </div>
              <button type="button" className="w-full h-11 border-2 border-dashed border-[#D6D1C4] rounded-[10px] flex items-center justify-center gap-2 text-sm text-[#5F6878] hover:border-[#1F3A68] hover:text-[#1F3A68] transition-colors">
                <Upload size={15} /> Aggiungi allegato
              </button>
            </SectionCard>

            <SectionCard title="Tolleranze e controllo" className="col-span-2">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Taglio", value: tolleranzaTaglio, set: setTolleranzaTaglio },
                  { label: "Cucitura", value: tolleranzaCucitura, set: setTolleranzaCucitura },
                  { label: "Colore", value: tolleranzaColore, set: setTolleranzaColore },
                  { label: "Stampa / ricamo", value: tolleranzaStampa, set: setTolleranzaStampa },
                  { label: "Controllo qualità", value: controlloQualita, set: setControlloQualita },
                  { label: "Packaging", value: packaging, set: setPackaging },
                ].map(({ label, value, set }) => (
                  <Field key={label} label={label}>
                    <textarea value={value} onChange={(e) => set(e.target.value)} onBlur={() => salva()} rows={2} className={textareaCls} />
                  </Field>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
});

export default TabProduzione;
