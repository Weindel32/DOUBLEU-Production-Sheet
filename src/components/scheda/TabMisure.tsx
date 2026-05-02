"use client";

import { useState } from "react";
import { TAGLIE_ADULTO, TAGLIE_KIDS, calcolaTotaleQuantita } from "@/lib/utils";
import type { SchedaCompleta, TabellaTaglie, QuantitaTaglia } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
}

const COLONNE_MISURE = [
  { key: "torace", label: "X. Torace" },
  { key: "lunghezza", label: "Lunghezza" },
  { key: "spalla", label: "Spalla" },
  { key: "lungManica", label: "Lung. manica" },
  { key: "fianchi", label: "Fianchi" },
  { key: "vita", label: "Vita" },
];

export default function TabMisure({ scheda, onSave }: Props) {
  const [tabellaMisure, setTabellaMisure] = useState<TabellaTaglie>(
    (scheda.tabellaMisure as TabellaTaglie) || {}
  );
  const [quantitaTaglia, setQuantitaTaglia] = useState<QuantitaTaglia>(
    (scheda.quantitaTaglia as QuantitaTaglia) || {}
  );
  const tutteLeTaglie = [...TAGLIE_ADULTO, ...TAGLIE_KIDS];
  const [tagliAttive, setTagliAttive] = useState<string[]>(
    tutteLeTaglie.filter((t) => tabellaMisure[t] || quantitaTaglia[t])
  );

  const totale = calcolaTotaleQuantita(quantitaTaglia as Record<string, number>);

  const aggiornaMisura = (taglia: string, campo: string, valore: string) => {
    setTabellaMisure((prev) => ({
      ...prev,
      [taglia]: { ...prev[taglia], [campo]: valore ? Number(valore) : undefined },
    }));
  };

  const aggiornaQuantita = (taglia: string, valore: string) => {
    setQuantitaTaglia((prev) => ({ ...prev, [taglia]: valore ? Number(valore) : 0 }));
  };

  const salva = async () => {
    await onSave({ tabellaMisure, quantitaTaglia });
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

      <div className="grid grid-cols-2 gap-5">
        {/* Tabella misure */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Tabella misure (cm)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Taglia</th>
                  {COLONNE_MISURE.map((c) => (
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
                    {COLONNE_MISURE.map((c) => (
                      <td key={c.key} className="px-2 py-1">
                        <input
                          type="number"
                          value={tabellaMisure[taglia]?.[c.key as keyof typeof tabellaMisure[string]] ?? ""}
                          onChange={(e) => aggiornaMisura(taglia, c.key, e.target.value)}
                          onBlur={salva}
                          className="w-14 text-right text-xs text-gray-700 border border-transparent focus:border-blue-300 rounded px-1 py-0.5 outline-none"
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

        {/* Quantità per taglia — size run orizzontale */}
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
