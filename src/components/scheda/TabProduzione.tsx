"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Upload, Info } from "lucide-react";
import type { SchedaCompleta, ConsumoMateriale } from "@/types";
import { calcolaTotaleQuantita } from "@/lib/utils";

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

function parseNum(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

function calcolaKgPerMetro(mat: MaterialeDisp): number | null {
  const peso = parseNum(mat.peso);
  if (!peso) return null;
  if (mat.unitaPeso === "g/m") return peso / 1000;
  const larghezza = parseNum(mat.larghezza);
  if (!larghezza) return null;
  return (peso * larghezza) / 100000;
}

function calcolaCostoMateriale(c: ConsumoMateriale, mat: MaterialeDisp | undefined): number {
  if (!mat || !mat.costoMetro) return 0;
  const consumo = c.consumoPerCapo || 0;
  if (mat.unitaMisura === "kg") {
    const kgPerM = calcolaKgPerMetro(mat);
    if (kgPerM === null) return 0;
    return consumo * kgPerM * mat.costoMetro;
  }
  if (mat.unitaMisura === "pz") return consumo * mat.costoMetro;
  return consumo * mat.costoMetro;
}

export default function TabProduzione({ scheda, onSave, materialiDisponibili }: Props) {
  const [noteProduzione, setNoteProduzione] = useState(scheda.noteProduzione || "");
  const [tolleranzaTaglio, setTolleranzaTaglio] = useState(scheda.tolleranzaTaglio || "± 1 cm");
  const [tolleranzaCucitura, setTolleranzaCucitura] = useState(scheda.tolleranzaCucitura || "Punto 4 aghi per le spalle.");
  const [tolleranzaColore, setTolleranzaColore] = useState(scheda.tolleranzaColore || "Variazione ammessa tra lotti.");
  const [tolleranzaStampa, setTolleranzaStampa] = useState(scheda.tolleranzaStampa || "Verificare centratura loghi prima della stampa.");
  const [controlloQualita, setControlloQualita] = useState(scheda.controlloQualita || "Controllare cuciture e bordi maniche.");
  const [packaging, setPackaging] = useState(scheda.packaging || "Busta singola con etichetta taglia.");
  const [consumi, setConsumi] = useState<ConsumoMateriale[]>(
    (scheda.consumoMateriale as ConsumoMateriale[]) || []
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
      materialeId: m.id, nomeM: m.nome, consumoPerCapo: 0, unita: "m", costoUnitario: m.costoMetro || 0,
    }]);
  };

  const rimuoviConsumo = (idx: number) => setConsumi((prev) => prev.filter((_, i) => i !== idx));

  const aggiornaConsumo = (idx: number, field: keyof ConsumoMateriale, value: string | number) => {
    setConsumi((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      if (field === "materialeId") {
        const m = materialiDisponibili.find((x) => x.id === value);
        return { ...c, materialeId: value as string, nomeM: m?.nome || "", costoUnitario: m?.costoMetro || 0 };
      }
      return { ...c, [field]: value };
    }));
  };

  const salva = async (extra?: Partial<SchedaCompleta>) => {
    const costoLavorazione =
      (parseFloat(costoTaglio || "0") || 0) +
      (parseFloat(costoCucitura || "0") || 0) +
      (parseFloat(costoStampa || "0") || 0) +
      (parseFloat(costoRicamo || "0") || 0);

    await onSave({
      noteProduzione, tolleranzaTaglio, tolleranzaCucitura, tolleranzaColore,
      tolleranzaStampa, controlloQualita, packaging,
      consumoMateriale: consumi,
      costoTaglio: costoTaglio ? parseFloat(costoTaglio) : null,
      costoCucitura: costoCucitura ? parseFloat(costoCucitura) : null,
      costoStampa: costoStampa ? parseFloat(costoStampa) : null,
      costoRicamo: costoRicamo ? parseFloat(costoRicamo) : null,
      costoLavorazione: costoLavorazione || null,
      prezzoVendita: prezzoVendita ? parseFloat(prezzoVendita) : null,
      ...extra,
    });
  };

  // Cost calculations
  const costoMaterialePerCapo = consumi.reduce((sum, c) => {
    const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
    return sum + calcolaCostoMateriale(c, mat);
  }, 0);

  const lavorazionePerCapo =
    (parseFloat(costoTaglio || "0") || 0) +
    (parseFloat(costoCucitura || "0") || 0) +
    (parseFloat(costoStampa || "0") || 0) +
    (parseFloat(costoRicamo || "0") || 0);

  const costoTotalePerCapo = costoMaterialePerCapo + lavorazionePerCapo;
  const costoTotaleOrdine = costoTotalePerCapo * totalePezzi;
  const vendita = parseFloat(prezzoVendita || "0") || 0;
  const margine = vendita > 0 && costoTotalePerCapo > 0
    ? ((vendita - costoTotalePerCapo) / vendita * 100)
    : null;

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Note di produzione */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Note di produzione</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Note generali</label>
            <textarea
              value={noteProduzione}
              onChange={(e) => setNoteProduzione(e.target.value)}
              onBlur={() => salva()}
              rows={3}
              placeholder="Note per il produttore..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-2 resize-none focus:border-blue-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tolleranze */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Tolleranze</h3>
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
              <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
              <textarea
                value={value}
                onChange={(e) => set(e.target.value)}
                onBlur={() => salva()}
                rows={2}
                className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:border-blue-400 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Colonna destra */}
      <div className="space-y-4">
        {/* Allegati */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Allegati</h3>
          <div className="space-y-2 mb-3">
            {(scheda.allegati || []).map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">
                  {a.split(".").pop()?.toUpperCase()}
                </div>
                <span className="flex-1 truncate">{a}</span>
              </div>
            ))}
          </div>
          <button className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
            <Upload size={14} />
            Aggiungi allegato
            <span className="text-xs">PDF, JPG, PNG</span>
          </button>
        </div>

        {/* Costi interni */}
        <div className="card border-2 border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Costi interni</h3>
            <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              <Info size={11} />
              Solo PDF interno
            </div>
          </div>

          {/* Consumo materiali */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Consumo materiale</div>
            <div className="space-y-2">
              {consumi.map((c, i) => {
                const mat = materialiDisponibili.find((m) => m.id === c.materialeId);
                const isKg = mat?.unitaMisura === "kg";
                const kgPerM = mat ? calcolaKgPerMetro(mat) : null;
                const costoRiga = calcolaCostoMateriale(c, mat);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <select
                        value={c.materialeId}
                        onChange={(e) => aggiornaConsumo(i, "materialeId", e.target.value)}
                        onBlur={() => salva()}
                        className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        {materialiDisponibili.map((m) => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                      <div className="flex items-center border border-gray-200 rounded px-2 py-1 w-20">
                        <input
                          type="number"
                          value={c.consumoPerCapo}
                          onChange={(e) => aggiornaConsumo(i, "consumoPerCapo", parseFloat(e.target.value) || 0)}
                          onBlur={() => salva()}
                          className="w-10 text-xs text-right outline-none"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-400 ml-1">m</span>
                      </div>
                      <button onClick={() => { rimuoviConsumo(i); salva(); }} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* Breakdown kg conversion */}
                    {isKg && (
                      <div className="ml-2 pl-2 border-l-2 border-orange-100 text-xs text-gray-400 space-y-0.5">
                        {kgPerM !== null ? (
                          <>
                            <div>
                              {mat?.unitaPeso === "g/m"
                                ? <>{mat?.peso ?? "—"} g/m = <span className="text-gray-600">{kgPerM.toFixed(4)} kg/m</span></>
                                : <>{mat?.peso ?? "—"} g/m² × {mat?.larghezza ?? "—"} cm = <span className="text-gray-600">{kgPerM.toFixed(4)} kg/m</span></>
                              }
                            </div>
                            <div>{c.consumoPerCapo} m × {kgPerM.toFixed(4)} kg/m × {mat?.costoMetro?.toFixed(2) ?? "—"} €/kg = <span className="font-semibold text-orange-600">€ {costoRiga.toFixed(2)}/capo</span></div>
                          </>
                        ) : (
                          <div className="text-orange-400">
                            {mat?.unitaPeso === "g/m"
                              ? "Inserire peso nel materiale per il calcolo automatico"
                              : "Inserire peso e larghezza nel materiale per il calcolo automatico"
                            }
                          </div>
                        )}
                      </div>
                    )}
                    {!isKg && mat && c.consumoPerCapo > 0 && mat.costoMetro && (
                      <div className="ml-2 text-xs text-gray-400">
                        {c.consumoPerCapo} m × {mat.costoMetro.toFixed(2)} €/m = <span className="font-semibold text-gray-600">€ {costoRiga.toFixed(2)}/capo</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={aggiungiConsumo}
              disabled={materialiDisponibili.length === 0}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"
            >
              <PlusCircle size={12} />
              Aggiungi materiale
            </button>
          </div>

          {/* Costi lavorazione breakdown */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-2">Costi lavorazione / capo</div>
            <div className="space-y-1.5">
              {[
                { label: "Taglio", value: costoTaglio, set: setCostoTaglio },
                { label: "Cucitura", value: costoCucitura, set: setCostoCucitura },
                { label: "Stampa", value: costoStampa, set: setCostoStampa },
                { label: "Ricamo", value: costoRicamo, set: setCostoRicamo },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</label>
                  <div className="flex items-center border border-gray-200 rounded px-2 py-1 flex-1">
                    <span className="text-xs text-gray-400">€</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      onBlur={() => salva()}
                      className="flex-1 text-xs text-right outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prezzo vendita */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-gray-400 w-20 flex-shrink-0">Prezzo vendita</label>
            <div className="flex items-center border border-gray-200 rounded px-2 py-1 flex-1">
              <span className="text-xs text-gray-400">€</span>
              <input
                type="number"
                value={prezzoVendita}
                onChange={(e) => setPrezzoVendita(e.target.value)}
                onBlur={() => salva()}
                className="flex-1 text-xs text-right outline-none"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Riepilogo costi */}
          {costoTotalePerCapo > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
              {costoMaterialePerCapo > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Materiali/capo</span>
                  <span>€ {costoMaterialePerCapo.toFixed(2)}</span>
                </div>
              )}
              {parseFloat(costoTaglio || "0") > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span className="pl-2">— Taglio</span>
                  <span>€ {parseFloat(costoTaglio).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(costoCucitura || "0") > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span className="pl-2">— Cucitura</span>
                  <span>€ {parseFloat(costoCucitura).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(costoStampa || "0") > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span className="pl-2">— Stampa</span>
                  <span>€ {parseFloat(costoStampa).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(costoRicamo || "0") > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span className="pl-2">— Ricamo</span>
                  <span>€ {parseFloat(costoRicamo).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-700 border-t border-gray-200 pt-1">
                <span>Costo totale/capo</span>
                <span>€ {costoTotalePerCapo.toFixed(2)}</span>
              </div>
              {totalePezzi > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Totale ordine ({totalePezzi} pz)</span>
                  <span>€ {costoTotaleOrdine.toFixed(2)}</span>
                </div>
              )}
              {vendita > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Prezzo vendita/capo</span>
                  <span>€ {vendita.toFixed(2)}</span>
                </div>
              )}
              {margine !== null && (
                <div className={`flex justify-between font-semibold border-t border-gray-200 pt-1 ${margine >= 30 ? "text-green-600" : margine >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                  <span>Margine</span>
                  <span>{margine.toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
