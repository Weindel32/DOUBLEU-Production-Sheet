"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Upload, Info } from "lucide-react";
import type { SchedaCompleta, ConsumoMateriale } from "@/types";
import { calcolaTotaleQuantita } from "@/lib/utils";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  materialiDisponibili: { id: string; nome: string; tipo: string; costoMetro: number | null }[];
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
  const [costoLavorazione, setCostoLavorazione] = useState(scheda.costoLavorazione?.toString() || "");
  const [prezzoVendita, setPrezzoVendita] = useState(scheda.prezzoVendita?.toString() || "");

  const quantitaTaglia = (scheda.quantitaTaglia as Record<string, number>) || {};
  const totalePezzi = calcolaTotaleQuantita(quantitaTaglia);

  const aggiungiConsumo = () => {
    if (materialiDisponibili.length === 0) return;
    const m = materialiDisponibili[0];
    const nuovo: ConsumoMateriale = {
      materialeId: m.id, nomeM: m.nome, consumoPerCapo: 0, unita: "ml", costoUnitario: m.costoMetro || 0,
    };
    setConsumi((prev) => [...prev, nuovo]);
  };

  const rimuoviConsumo = (idx: number) => {
    setConsumi((prev) => prev.filter((_, i) => i !== idx));
  };

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
    await onSave({
      noteProduzione, tolleranzaTaglio, tolleranzaCucitura, tolleranzaColore,
      tolleranzaStampa, controlloQualita, packaging,
      consumoMateriale: consumi,
      costoLavorazione: costoLavorazione ? parseFloat(costoLavorazione) : null,
      prezzoVendita: prezzoVendita ? parseFloat(prezzoVendita) : null,
      ...extra,
    });
  };

  // Calcolo costo totale per capo
  const costoMaterialePerCapo = consumi.reduce((sum, c) => sum + (c.consumoPerCapo * (c.costoUnitario || 0)), 0);
  const costoTotalePerCapo = costoMaterialePerCapo + (costoLavorazione ? parseFloat(costoLavorazione) : 0);
  const costoTotaleOrdine = costoTotalePerCapo * totalePezzi;
  const margine = prezzoVendita && costoTotalePerCapo ? ((parseFloat(prezzoVendita) - costoTotalePerCapo) / parseFloat(prezzoVendita) * 100) : null;

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

      {/* Colonna destra: allegati + costi interni */}
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

        {/* Costi interni — non appaiono nel PDF tecnico */}
        <div className="card border-2 border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Costi interni</h3>
            <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              <Info size={11} />
              Solo PDF interno
            </div>
          </div>

          {/* Consumo materiali */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">Consumo materiale per capo</div>
            <div className="space-y-2">
              {consumi.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
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
                  <input
                    type="number"
                    value={c.consumoPerCapo}
                    onChange={(e) => aggiornaConsumo(i, "consumoPerCapo", parseFloat(e.target.value))}
                    onBlur={() => salva()}
                    className="w-16 text-xs border border-gray-200 rounded px-2 py-1 text-right"
                    placeholder="0"
                  />
                  <select
                    value={c.unita}
                    onChange={(e) => aggiornaConsumo(i, "unita", e.target.value)}
                    onBlur={() => salva()}
                    className="w-14 text-xs border border-gray-200 rounded px-1 py-1"
                  >
                    <option>ml</option>
                    <option>cm</option>
                    <option>pz</option>
                    <option>g</option>
                  </select>
                  <button onClick={() => rimuoviConsumo(i)} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
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

          {/* Costo lavorazione e prezzo vendita */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-32">Costo lavorazione/capo</label>
              <div className="flex items-center border border-gray-200 rounded px-2 py-1 flex-1">
                <span className="text-xs text-gray-400">€</span>
                <input
                  type="number"
                  value={costoLavorazione}
                  onChange={(e) => setCostoLavorazione(e.target.value)}
                  onBlur={() => salva()}
                  className="flex-1 text-xs text-right outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-32">Prezzo di vendita/capo</label>
              <div className="flex items-center border border-gray-200 rounded px-2 py-1 flex-1">
                <span className="text-xs text-gray-400">€</span>
                <input
                  type="number"
                  value={prezzoVendita}
                  onChange={(e) => setPrezzoVendita(e.target.value)}
                  onBlur={() => salva()}
                  className="flex-1 text-xs text-right outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Riepilogo costi */}
          {costoTotalePerCapo > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Costo materiali/capo</span>
                <span>€ {costoMaterialePerCapo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Costo lavorazione/capo</span>
                <span>€ {parseFloat(costoLavorazione || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-700 border-t border-gray-200 pt-1">
                <span>Costo totale/capo</span>
                <span>€ {costoTotalePerCapo.toFixed(2)}</span>
              </div>
              {totalePezzi > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Costo totale ordine ({totalePezzi} pz)</span>
                  <span>€ {costoTotaleOrdine.toFixed(2)}</span>
                </div>
              )}
              {margine !== null && prezzoVendita && (
                <div className={`flex justify-between font-semibold ${margine >= 0 ? "text-green-600" : "text-red-600"}`}>
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
