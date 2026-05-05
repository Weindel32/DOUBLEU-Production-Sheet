"use client";

import { useState } from "react";
import { TAGLIE_ADULTO, TAGLIE_KIDS, calcolaTotaleQuantita, CATEGORIE_ELASTICO } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";
import type { SchedaCompleta, TabellaTaglie, QuantitaTaglia, ElasticoSpecs, MisureTaglia } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
}

const CATEGORIE_SKIRT = ["Skirt", "Gonnellino"];

const ELASTICO_ADULTO: Record<string, { pantaloncino: number; skirt: number }> = {
  "XS":   { pantaloncino: 70, skirt: 64 },
  "S":    { pantaloncino: 72, skirt: 66 },
  "M":    { pantaloncino: 74, skirt: 68 },
  "L":    { pantaloncino: 76, skirt: 70 },
  "XL":   { pantaloncino: 78, skirt: 72 },
  "XXL":  { pantaloncino: 80, skirt: 74 },
  "XXXL": { pantaloncino: 82, skirt: 76 },
};

const ELASTICO_KIDS: Record<string, number> = {
  "4A": 54, "6A": 56, "8A": 58, "10A": 60, "12A": 62, "14A": 64, "16A": 66,
};

function getElasticoDefault(categoria: string | null | undefined, taglia: string): { lunghezzaElastico: number; altezzaElastico: number } | null {
  const isSkirt = CATEGORIE_SKIRT.includes(categoria || "");
  const altezzaElastico = isSkirt ? 1 : 4;
  if (ELASTICO_KIDS[taglia] !== undefined) return { lunghezzaElastico: ELASTICO_KIDS[taglia], altezzaElastico };
  if (ELASTICO_ADULTO[taglia]) return { lunghezzaElastico: isSkirt ? ELASTICO_ADULTO[taglia].skirt : ELASTICO_ADULTO[taglia].pantaloncino, altezzaElastico };
  return null;
}

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
  const [specsElastico, setSpecsElastico] = useState<ElasticoSpecs>(() => {
    const existing = (rawTabella.__specs as ElasticoSpecs) || {};
    if (isElastico && !existing.altezza) {
      const defaultAltezza = CATEGORIE_SKIRT.includes(scheda.categoria || "") ? "1" : "4";
      return { ...existing, altezza: defaultAltezza };
    }
    return existing;
  });

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

  const [saving, setSaving] = useState(false);

  const salva = async () => {
    setSaving(true);
    const tabellaDaSalvare = isElastico
      ? { ...tabellaMisure, __specs: specsElastico }
      : tabellaMisure;
    await onSave({ tabellaMisure: tabellaDaSalvare, quantitaTaglia });
    setSaving(false);
  };

  const toggleTaglia = (taglia: string) => {
    if (tagliAttive.includes(taglia)) {
      setTagliAttive((prev) => prev.filter((t) => t !== taglia));
    } else {
      setTagliAttive((prev) => [...prev, taglia]);
      if (isElastico && !(tabellaMisure[taglia] as MisureTaglia)?.lunghezzaElastico) {
        const defaults = getElasticoDefault(scheda.categoria, taglia);
        if (defaults) {
          setTabellaMisure((prev) => ({
            ...prev,
            [taglia]: { ...(prev[taglia] as MisureTaglia || {}), ...defaults },
          }));
        }
      }
    }
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

    <div className="flex justify-end pt-2">
      <button
        onClick={salva}
        disabled={saving}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  );
}
