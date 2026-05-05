"use client";

import { useState } from "react";
import { TAGLIE_ADULTO, TAGLIE_KIDS, calcolaTotaleQuantita } from "@/lib/utils";
import type { SchedaCompleta, TabellaTaglie, QuantitaTaglia, ElasticoSpecs, MisureTaglia } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
}

const CATEGORIE_ELASTICO = ["Pantaloncino", "Short", "Skirt"];

const COLONNE_STANDARD = [
  { key: "torace", label: "X. Torace" },
  { key: "lunghezza", label: "Lunghezza" },
  { key: "spalla", label: "Spalla" },
  { key: "lungManica", label: "Lung. manica" },
  { key: "fianchi", label: "Fianchi" },
  { key: "vita", label: "Vita" },
];

const COLONNE_ELASTICO = [
  { key: "lunghezzaElastico", label: "Lung. Elastico (cm)" },
  { key: "altezzaElastico", label: "Altezza (cm)" },
];

export default function TabMisure({ scheda, onSave }: Props) {
  const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
  const colonne = isElastico ? COLONNE_ELASTICO : COLONNE_STANDARD;

  const rawTabella = (scheda.tabellaMisure as TabellaTaglie) || {};
  const [tabellaMisure, setTabellaMisure] = useState<TabellaTaglie>(rawTabella);
  const [quantitaTaglia, setQuantitaTaglia] = useState<QuantitaTaglia>(
    (scheda.quantitaTaglia as QuantitaTaglia) || {}
  );
  const [specsElastico, setSpecsElastico] = useState<ElasticoSpecs>(
    (rawTabella.__specs as ElasticoSpecs) || {}
  );

  const tutteLeTaglie = [...TAGLIE_ADULTO, ...TAGLIE_KIDS];
  const [tagliAttive, setTagliAttive] = useState<string[]>(
    tutteLeTaglie.filter((t) => tabellaMisure[t] || quantitaTaglia[t])
  );

  const totale = calcolaTotaleQuantita(quantitaTaglia as Record<string, number>);

  const aggiornaMisura = (taglia: string, campo: string, valore: string) => {
    setTabellaMisure((prev) => ({
      ...prev,
      [taglia]: { ...(prev[taglia] as MisureTaglia), [campo]: valore ? Number(valore) : undefined },
    }));
  };

  const aggiornaSpec = (campo: keyof ElasticoSpecs, valore: string) => {
    setSpecsElastico((prev) => ({ ...prev, [campo]: valore }));
  };

  const aggiornaQuantita = (taglia: string, valore: string) => {
    setQuantitaTaglia((prev) => ({ ...prev, [taglia]: valore ? Number(valore) : 0 }));
  };

  const salva = async () => {
    const tabellaDaSalvare = isElastico
      ? { ...tabellaMisure, __specs: specsElastico }
      : tabellaMisure;
    await onSave({ tabellaMisure: tabellaDaSalvare, quantitaTaglia });
  };

  const toggleTaglia = (taglia: string) => {
    setTagliAttive((prev) =>
      prev.includes(taglia) ? prev.filter((t) => t !== taglia) : [...prev, taglia]
    );
  };

  return (
    <div className="space-y-5">
      {/* Selezione taglie */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Taglie attive</h3>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">ADULTO</p>
            <div className="flex gap-2 flex-wrap">
              {TAGLIE_ADULTO.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTaglia(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tagliAttive.includes(t)
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-gray-500 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">KIDS</p>
            <div className="flex gap-2 flex-wrap">
              {TAGLIE_KIDS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTaglia(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tagliAttive.includes(t)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-500 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specifiche Elastico Vita — solo per Pantaloncino / Short / Skirt */}
      {isElastico && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Specifiche Elastico Vita
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Altezza elastico (cm)</label>
              <input
                type="text"
                value={specsElastico.altezza ?? ""}
                onChange={(e) => aggiornaSpec("altezza", e.target.value)}
                onBlur={salva}
                placeholder="es. 4"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo</label>
              <input
                type="text"
                value={specsElastico.tipo ?? ""}
                onChange={(e) => aggiornaSpec("tipo", e.target.value)}
                onBlur={salva}
                placeholder="es. elastico interno con tunnel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Costruzione</label>
              <input
                type="text"
                value={specsElastico.costruzione ?? ""}
                onChange={(e) => aggiornaSpec("costruzione", e.target.value)}
                onBlur={salva}
                placeholder="es. ribattitura superiore e inferiore"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Applicazione</label>
              <input
                type="text"
                value={specsElastico.applicazione ?? ""}
                onChange={(e) => aggiornaSpec("applicazione", e.target.value)}
                onBlur={salva}
                placeholder="es. con leggera tensione per stabilità"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Tabella misure */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              {isElastico ? "Tabella elastico per taglia" : "Tabella misure (cm)"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Taglia</th>
                  {colonne.map((c) => (
                    <th key={c.key} className="text-right px-2 py-2 text-gray-500 font-medium text-xs whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tagliAttive.map((taglia) => (
                  <tr key={taglia} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-semibold text-gray-700 text-xs">{taglia}</td>
                    {colonne.map((c) => (
                      <td key={c.key} className="px-2 py-1">
                        <input
                          type="number"
                          value={(tabellaMisure[taglia] as MisureTaglia)?.[c.key as keyof MisureTaglia] ?? ""}
                          onChange={(e) => aggiornaMisura(taglia, c.key, e.target.value)}
                          onBlur={salva}
                          className="w-16 text-right text-xs text-gray-700 border border-transparent focus:border-blue-300 rounded px-1 py-0.5 outline-none"
                          placeholder="—"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-gray-400 italic">Clicca sui valori per modificarli</div>
        </div>

        {/* Quantità per taglia */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Quantità per taglia</h3>
            <span className="text-xs text-blue-700 font-semibold">Totale: {totale} pz</span>
          </div>
          <div className="overflow-x-auto px-4 py-4">
            <table className="text-sm">
              <thead>
                <tr>
                  {tagliAttive.map((t) => (
                    <th key={t} className="text-center px-3 py-1 text-xs font-semibold text-gray-500 min-w-[52px]">{t}</th>
                  ))}
                  <th className="text-center px-3 py-1 text-xs font-semibold text-blue-700 min-w-[52px]">TOT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {tagliAttive.map((taglia) => (
                    <td key={taglia} className="text-center px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        value={quantitaTaglia[taglia] ?? ""}
                        onChange={(e) => aggiornaQuantita(taglia, e.target.value)}
                        onBlur={salva}
                        className="w-12 text-center text-sm font-medium text-gray-700 border border-gray-200 focus:border-blue-400 rounded-lg px-1 py-1 outline-none"
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td className="text-center px-3 py-1 font-bold text-blue-700 text-sm">{totale}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
