"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { PlusCircle, Trash2, Upload, Info } from "lucide-react";
import type { SchedaCompleta, ConsumoMateriale } from "@/types";
import { calcolaTotaleQuantita, parseNumIt, calcolaKgPerMetroLineare, calcolaCostoAlMetro } from "@/lib/utils";

interface MaterialeDisp {
  id: string;
  nome: string;
  tipo: string;
  costoMetro: number | null;
  unitaMisura: string | null;
  peso: string | null;
  unitaPeso: string | null;
  larghezza: string | null;
}

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  materialiDisponibili: MaterialeDisp[];
}

export interface TabProduzioneHandle {
  save: () => Promise<void>;
}

const parseNum = parseNumIt;
const calcolaKgPerMetro = calcolaKgPerMetroLineare;

function calcolaCostoMateriale(c: ConsumoMateriale, mat: MaterialeDisp | undefined): number {
  if (!mat || !mat.costoMetro) return 0;
  const consumo = c.consumoPerCapo || 0;
  if (mat.unitaMisura === "kg") {
    const kgPerM = calcolaKgPerMetro(mat);
    if (kgPerM === null) return 0;
    return consumo * kgPerM * mat.costoMetro;
  }
  return consumo * mat.costoMetro;
}

/**
 * Costo unitario "per metro/pezzo" da persistere nel consumo materiale: già convertito
 * quando il materiale è prezzato al kg, così il PDF può limitarsi a moltiplicare per il
 * consumo senza riconoscere l'unità di misura originale del materiale.
 */
function costoUnitarioPersistito(mat: MaterialeDisp | undefined): number {
  if (!mat) return 0;
  if (mat.unitaMisura === "kg") return calcolaCostoAlMetro(mat) ?? 0;
  return mat.costoMetro || 0;
}

const TabProduzione = forwardRef<TabProduzioneHandle, Props>(function TabProduzione({ scheda, onSave, materialiDisponibili }, ref) {
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
    ((scheda.consumoMateriale as ConsumoMateriale[]) || []).map((c) => c.consumoPerCapo?.toString() ?? "")
  );
  const [costoTaglio, setCostoTaglio] = useState(scheda.costoTaglio?.toString() || "");
  const [costoCucitura, setCostoCucitura] = useState(scheda.costoCucitura?.toString() || "");
  const [costoStampa, setCostoStampa] = useState(scheda.costoStampa?.toString() || "");
  const [costoRicamo, setCostoRicamo] = useState(scheda.costoRicamo?.toString() || "");
  const [prezzoVendita, setPrezzoVendita] = useState(scheda.prezzoVendita?.toString() || "");

  const quantitaTaglia = (scheda.quantitaTaglia as Record<string, number>) || {};
  const totalePezzi = calcolaTotaleQuantita(quantitaTaglia);

  const aggiungiConsumo = () => {
    if (materialiDisponibili.length === 0) return;
    const m = materialiDisponibili[0];
    setConsumi((prev) => [...prev, {
      materialeId: m.id, nomeM: m.nome, consumoPerCapo: 0, unita: "m", costoUnitario: costoUnitarioPersistito(m),
    }]);
    setConsumiStr((prev) => [...prev, ""]);
  };

  const rimuoviConsumo = (idx: number) => {
    setConsumi((prev) => prev.filter((_, i) => i !== idx));
    setConsumiStr((prev) => prev.filter((_, i) => i !== idx));
  };

  const aggiornaConsumo = (idx: number, field: keyof ConsumoMateriale, value: string | number) => {
    setConsumi((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      if (field === "materialeId") {
        const m = materialiDisponibili.find((x) => x.id === value);
        return { ...c, materialeId: value as string, nomeM: m?.nome || "", costoUnitario: costoUnitarioPersistito(m) };
      }
      return { ...c, [field]: value };
    }));
  };

  const aggiornaConsumoStr = (idx: number, raw: string) => {
    setConsumiStr((prev) => prev.map((s, i) => i === idx ? raw : s));
    const n = parseNum(raw);
    setConsumi((prev) => prev.map((c, i) => i === idx ? { ...c, consumoPerCapo: n ?? 0 } : c));
  };

  const salva = async (extra?: Partial<SchedaCompleta>) => {
    const pTaglio = parseNum(costoTaglio) ?? 0;
    const pCucitura = parseNum(costoCucitura) ?? 0;
    const pStampa = parseNum(costoStampa) ?? 0;
    const pRicamo = parseNum(costoRicamo) ?? 0;
    const costoLavorazione = pTaglio + pCucitura + pStampa + pRicamo;

    const consumiAggiornati = consumi.map((c) => {
      const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
      return { ...c, costoUnitario: costoUnitarioPersistito(mat) };
    });
    setConsumi(consumiAggiornati);

    await onSave({
      noteProduzione, tolleranzaTaglio, tolleranzaCucitura, tolleranzaColore,
      tolleranzaStampa, controlloQualita, packaging,
      consumoMateriale: consumiAggiornati,
      costoTaglio: parseNum(costoTaglio),
      costoCucitura: parseNum(costoCucitura),
      costoStampa: parseNum(costoStampa),
      costoRicamo: parseNum(costoRicamo),
      costoLavorazione: costoLavorazione || null,
      prezzoVendita: parseNum(prezzoVendita),
      ...extra,
    });
  };

  const salvaAll = async () => {
    await salva();
  };

  useImperativeHandle(ref, () => ({ save: salvaAll }));

  // Cost calculations
  const costoMaterialePerCapo = consumi.reduce((sum, c) => {
    const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
    return sum + calcolaCostoMateriale(c, mat);
  }, 0);

  const lavorazionePerCapo =
    (parseNum(costoTaglio) ?? 0) +
    (parseNum(costoCucitura) ?? 0) +
    (parseNum(costoStampa) ?? 0) +
    (parseNum(costoRicamo) ?? 0);

  const costoTotalePerCapo = costoMaterialePerCapo + lavorazionePerCapo;
  const costoTotaleOrdine = costoTotalePerCapo * totalePezzi;
  const vendita = parseNum(prezzoVendita) ?? 0;
  const margine = vendita > 0 && costoTotalePerCapo > 0
    ? ((vendita - costoTotalePerCapo) / vendita * 100)
    : null;

  return (
    <>
    <div className="grid grid-cols-3 gap-5">
      {/* Note di produzione */}
      <div className="card">
        <h3 className="section-title">Note di produzione</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#4e6585] block mb-1">Note generali</label>
            <textarea
              value={noteProduzione}
              onChange={(e) => setNoteProduzione(e.target.value)}
              onBlur={() => salva()}
              rows={3}
              placeholder="Note per il produttore..."
              className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg p-2 resize-none focus:border-blue-500/50 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tolleranze */}
      <div className="card">
        <h3 className="section-title">Tolleranze</h3>
        <div className="space-y-2.5">
          {[
            { label: "Taglio", value: tolleranzaTaglio, set: setTolleranzaTaglio },
            { label: "Cucitura", value: tolleranzaCucitura, set: setTolleranzaCucitura },
            { label: "Colore", value: tolleranzaColore, set: setTolleranzaColore },
            { label: "Stampa / Ricamo", value: tolleranzaStampa, set: setTolleranzaStampa },
            { label: "Controllo qualità", value: controlloQualita, set: setControlloQualita },
            { label: "Packaging", value: packaging, set: setPackaging },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs text-[#4e6585] block mb-0.5">{label}</label>
              <textarea
                value={value}
                onChange={(e) => set(e.target.value)}
                onBlur={() => salva()}
                rows={2}
                className="w-full text-xs text-[#e8edf4] border border-white/10 rounded-lg px-2 py-1.5 resize-none focus:border-blue-500/50 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Colonna destra */}
      <div className="space-y-4">
        {/* Allegati */}
        <div className="card">
          <h3 className="section-title">Allegati</h3>
          <div className="space-y-2 mb-3">
            {(scheda.allegati || []).map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-[#1a3060]/[0.03] rounded-lg text-xs text-[#8ba3c7]">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-400 text-xs font-bold">
                  {a.split(".").pop()?.toUpperCase()}
                </div>
                <span className="flex-1 truncate">{a}</span>
              </div>
            ))}
          </div>
          <button className="w-full border-2 border-dashed border-white/10 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm text-[#4e6585] hover:border-blue-500/40 hover:text-blue-500 transition-colors">
            <Upload size={14} />
            Aggiungi allegato
            <span className="text-xs">PDF, JPG, PNG</span>
          </button>
        </div>

        {/* Costi interni */}
        <div className="card border-2 border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="section-title">Costi interni</h3>
            <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              <Info size={11} />
              Solo PDF interno
            </div>
          </div>

          {/* Consumo materiali */}
          <div className="mb-4">
            <div className="text-xs font-medium text-[#8ba3c7] mb-2">Consumo materiale</div>
            <div className="space-y-2">
              {consumi.map((c, i) => {
                const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
                const isKg = mat?.unitaMisura === "kg";
                const kgPerM = mat ? calcolaKgPerMetro(mat) : null;
                const costoRiga = calcolaCostoMateriale(c, mat);
                return (
                  <div key={i} className="bg-[#1a3060]/[0.03] rounded-lg px-3 py-2 space-y-1.5">
                    {/* Riga 1: materiale + consumo + elimina */}
                    <div className="flex items-center gap-2">
                      <select
                        value={c.materialeId}
                        onChange={(e) => aggiornaConsumo(i, "materialeId", e.target.value)}
                        onBlur={() => salva()}
                        className="flex-1 text-xs border border-white/10 rounded px-2 py-1 bg-[#1a3060]"
                      >
                        {materialiDisponibili.map((m) => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                      <div className="flex items-center border border-white/10 rounded px-2 py-1 w-20 bg-[#1a3060]">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={consumiStr[i] ?? ""}
                          onChange={(e) => aggiornaConsumoStr(i, e.target.value)}
                          onBlur={() => salva()}
                          className="w-10 text-xs text-right outline-none bg-[#1a3060]"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#4e6585] ml-1">m</span>
                      </div>
                      <button onClick={() => { rimuoviConsumo(i); salva(); }} className="text-[#4e6585] hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* Riga 2: risultati */}
                    {c.consumoPerCapo > 0 && mat?.costoMetro && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-orange-600">€ {costoRiga.toFixed(2)}/capo</span>
                          {isKg && kgPerM !== null && totalePezzi > 0 && (
                            <span className="text-xs text-[#4e6585]">· {(totalePezzi * c.consumoPerCapo * kgPerM).toFixed(1)} kg ordine</span>
                          )}
                        </div>
                        {isKg && kgPerM === null && (
                          <span className="text-xs text-orange-400">Inserire peso nel materiale</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={aggiungiConsumo}
              disabled={materialiDisponibili.length === 0}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-400 disabled:opacity-40"
            >
              <PlusCircle size={12} />
              Aggiungi materiale
            </button>
          </div>

          {/* Costi lavorazione breakdown */}
          <div className="mb-3">
            <div className="text-xs font-medium text-[#8ba3c7] mb-2">Costi lavorazione / capo</div>
            <div className="space-y-1.5">
              {[
                { label: "Taglio", value: costoTaglio, set: setCostoTaglio },
                { label: "Cucitura", value: costoCucitura, set: setCostoCucitura },
                { label: "Stampa", value: costoStampa, set: setCostoStampa },
                { label: "Ricamo", value: costoRicamo, set: setCostoRicamo },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-xs text-[#4e6585] w-20 flex-shrink-0">{label}</label>
                  <div className="flex items-center border border-white/10 rounded px-2 py-1 flex-1">
                    <span className="text-xs text-[#4e6585]">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      onBlur={() => salva()}
                      className="flex-1 text-xs text-right outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prezzo vendita */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-[#4e6585] w-20 flex-shrink-0">Prezzo vendita</label>
            <div className="flex items-center border border-white/10 rounded px-2 py-1 flex-1">
              <span className="text-xs text-[#4e6585]">€</span>
              <input
                type="text"
                inputMode="decimal"
                value={prezzoVendita}
                onChange={(e) => setPrezzoVendita(e.target.value)}
                onBlur={() => salva()}
                className="flex-1 text-xs text-right outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Riepilogo costi */}
          {costoTotalePerCapo > 0 && (
            <div className="bg-[#1a3060]/[0.03] rounded-lg p-3 space-y-1 text-xs">
              {costoMaterialePerCapo > 0 && (
                <div className="flex justify-between text-[#8ba3c7]">
                  <span>Materiali/capo</span>
                  <span>€ {costoMaterialePerCapo.toFixed(2)}</span>
                </div>
              )}
              {(parseNum(costoTaglio) ?? 0) > 0 && (
                <div className="flex justify-between text-[#4e6585]">
                  <span className="pl-2">— Taglio</span>
                  <span>€ {(parseNum(costoTaglio) ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(parseNum(costoCucitura) ?? 0) > 0 && (
                <div className="flex justify-between text-[#4e6585]">
                  <span className="pl-2">— Cucitura</span>
                  <span>€ {(parseNum(costoCucitura) ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(parseNum(costoStampa) ?? 0) > 0 && (
                <div className="flex justify-between text-[#4e6585]">
                  <span className="pl-2">— Stampa</span>
                  <span>€ {(parseNum(costoStampa) ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(parseNum(costoRicamo) ?? 0) > 0 && (
                <div className="flex justify-between text-[#4e6585]">
                  <span className="pl-2">— Ricamo</span>
                  <span>€ {(parseNum(costoRicamo) ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[#e8edf4] border-t border-white/10 pt-1">
                <span>Costo totale/capo</span>
                <span>€ {costoTotalePerCapo.toFixed(2)}</span>
              </div>
              {totalePezzi > 0 && (
                <div className="flex justify-between text-[#8ba3c7]">
                  <span>Totale ordine ({totalePezzi} pz)</span>
                  <span>€ {costoTotaleOrdine.toFixed(2)}</span>
                </div>
              )}
              {vendita > 0 && (
                <div className="flex justify-between text-[#8ba3c7]">
                  <span>Prezzo vendita/capo</span>
                  <span>€ {vendita.toFixed(2)}</span>
                </div>
              )}
              {margine !== null && (
                <div className={`flex justify-between font-semibold border-t border-white/10 pt-1 ${margine >= 30 ? "text-green-600" : margine >= 0 ? "text-yellow-600" : "text-red-400"}`}>
                  <span>Margine</span>
                  <span>{margine.toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    </>
  );
});

export default TabProduzione;
