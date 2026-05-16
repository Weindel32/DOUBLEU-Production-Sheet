"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { TAGLIE_ADULTO, TAGLIE_KIDS, calcolaTotaleQuantita, CATEGORIE_ELASTICO } from "@/lib/utils";
import type { SchedaCompleta, TabellaTaglie, QuantitaTaglia, ElasticoSpecs, MisureTaglia } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
}

export interface TabMisureHandle {
  save: () => Promise<void>;
}

const CATEGORIE_SKIRT = ["Skirt"];

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

const TabMisure = forwardRef<TabMisureHandle, Props>(function TabMisure({ scheda, onSave }, ref) {
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
    const normalizzato = valore.replace(",", ".");
    setTabellaMisure((prev) => ({
      ...prev,
      [taglia]: { ...(prev[taglia] as MisureTaglia), [campo]: normalizzato ? Number(normalizzato) : undefined },
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

  useImperativeHandle(ref, () => ({ save: salva }));

  const toggleTaglia = async (taglia: string) => {
    if (tagliAttive.includes(taglia)) {
      setTagliAttive((prev) => prev.filter((t) => t !== taglia));
    } else {
      setTagliAttive((prev) => [...prev, taglia]);
      if (isElastico && !(tabellaMisure[taglia] as MisureTaglia)?.lunghezzaElastico) {
        const defaults = getElasticoDefault(scheda.categoria, taglia);
        if (defaults) {
          const nuovaTabella: TabellaTaglie = {
            ...tabellaMisure,
            [taglia]: { ...(tabellaMisure[taglia] as MisureTaglia || {}), ...defaults },
            __specs: specsElastico,
          };
          setTabellaMisure(nuovaTabella);
          await onSave({ tabellaMisure: nuovaTabella, quantitaTaglia });
        }
      }
    }
  };

  return (
    <>
    <div className="space-y-5">
      {/* Selezione taglie */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Taglie attive</h3>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-[#4e6585] mb-1.5 font-medium">ADULTO</p>
            <div className="flex gap-2 flex-wrap">
              {TAGLIE_ADULTO.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTaglia(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tagliAttive.includes(t)
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-[#1a3060] text-[#8ba3c7] border-white/15 hover:border-blue-500/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-[#4e6585] mb-1.5 font-medium">KIDS</p>
            <div className="flex gap-2 flex-wrap">
              {TAGLIE_KIDS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTaglia(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tagliAttive.includes(t)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-[#1a3060] text-[#8ba3c7] border-white/15 hover:border-orange-300"
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
          <h3 className="section-title">
            Specifiche Elastico Vita
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { key: "altezza",     label: "Altezza elastico (cm)", placeholder: "es. 4" },
              { key: "tipo",        label: "Tipo",                  placeholder: "es. elastico interno con tunnel" },
              { key: "costruzione", label: "Costruzione",           placeholder: "es. ribattitura superiore e inferiore" },
              { key: "applicazione",label: "Applicazione",          placeholder: "es. con leggera tensione per stabilità" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col">
                <label className="text-xs text-[#8ba3c7] mb-1 whitespace-nowrap">{label}</label>
                <input
                  type="text"
                  value={specsElastico[key as keyof ElasticoSpecs] ?? ""}
                  onChange={(e) => aggiornaSpec(key as keyof ElasticoSpecs, e.target.value)}
                  onBlur={salva}
                  placeholder={placeholder}
                  className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-500/50 outline-none bg-[#1a3060]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Tabella misure */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h3 className="section-title">
              {isElastico ? "Tabella elastico per taglia" : "Tabella misure (cm)"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a3060]/[0.03]">
                  <th className="text-left px-3 py-2 text-[#8ba3c7] font-medium text-xs">Taglia</th>
                  {colonne.map((c) => (
                    <th key={c.key} className="text-right px-2 py-2 text-[#8ba3c7] font-medium text-xs whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tagliAttive.map((taglia) => (
                  <tr key={taglia} className="hover:bg-[#1a3060]/[0.03]">
                    <td className="px-3 py-1.5 font-semibold text-[#e8edf4] text-xs">{taglia}</td>
                    {colonne.map((c) => (
                      <td key={c.key} className="px-2 py-1 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={(tabellaMisure[taglia] as MisureTaglia)?.[c.key as keyof MisureTaglia] ?? ""}
                          onChange={(e) => aggiornaMisura(taglia, c.key, e.target.value)}
                          onBlur={salva}
                          className="w-full text-right text-xs text-[#e8edf4] border border-transparent focus:border-blue-300 rounded px-1 py-0.5 outline-none"
                          placeholder="—"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-[#4e6585] italic">Clicca sui valori per modificarli</div>
        </div>

        {/* Quantità per taglia */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h3 className="section-title">Quantità per taglia</h3>
            <span className="text-xs text-blue-400 font-semibold">Totale: {totale} pz</span>
          </div>
          <div className="overflow-x-auto px-4 py-4">
            <table className="text-sm">
              <thead>
                <tr>
                  {tagliAttive.map((t) => (
                    <th key={t} className="text-center px-3 py-1 text-xs font-semibold text-[#8ba3c7] min-w-[52px]">{t}</th>
                  ))}
                  <th className="text-center px-3 py-1 text-xs font-semibold text-blue-400 min-w-[52px]">TOT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {tagliAttive.map((taglia) => (
                    <td key={taglia} className="text-center px-2 py-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={quantitaTaglia[taglia] ?? ""}
                        onChange={(e) => aggiornaQuantita(taglia, e.target.value.replace(/\D/g, ""))}
                        onBlur={salva}
                        className="w-12 text-center text-sm font-medium text-[#e8edf4] border border-white/10 focus:border-blue-500/50 rounded-lg px-1 py-1 outline-none"
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td className="text-center px-3 py-1 font-bold text-blue-400 text-sm">{totale}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    </>
  );
});

export default TabMisure;
