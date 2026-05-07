"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { PlusCircle, Trash2, ExternalLink, X } from "lucide-react";
import { TECNICHE_LOGO, POSIZIONI_LOGO } from "@/lib/utils";
import type { SchedaCompleta, LogoSchedaCompleto } from "@/types";
import ColorPickerNamed from "@/components/ui/ColorPickerNamed";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  loghiDisponibili: { id: string; nome: string; file: string; tipo: string }[];
}

export interface TabPersonalizzazioneHandle {
  save: () => Promise<void>;
}

const DESTINAZIONI_COLORE = [
  "Colletto",
  "Bordino manica",
  "Striscia orizzontale",
  "Striscia verticale",
  "Altro",
];

interface ColoreSecondarioVoce {
  id: string;
  colore: string;
  destinazione: string;
  altroTesto: string;
}

function parseColoriSecondari(raw: string | null | undefined): ColoreSecondarioVoce[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v: Omit<ColoreSecondarioVoce, "id">) => ({
        ...v,
        id: Math.random().toString(36).slice(2),
      }));
    }
  } catch {
    // Legacy: single plain string
  }
  return [{ id: Math.random().toString(36).slice(2), colore: raw, destinazione: "", altroTesto: "" }];
}

function serializeColoriSecondari(voci: ColoreSecondarioVoce[]): string {
  return JSON.stringify(
    voci.map(({ id: _id, ...rest }) => rest)
  );
}

const TabPersonalizzazione = forwardRef<TabPersonalizzazioneHandle, Props>(function TabPersonalizzazione({ scheda, onSave, loghiDisponibili }, ref) {
  const [loghi, setLoghi] = useState<LogoSchedaCompleto[]>(scheda.loghi || []);
  const [colorePrincipale, setColorePrincipale] = useState(scheda.colorePrincipale || "");
  const [coloriSecondari, setColoriSecondari] = useState<ColoreSecondarioVoce[]>(
    parseColoriSecondari(scheda.coloreSecondario)
  );
  const [notePersonalizzazione, setNotePersonalizzazione] = useState(scheda.notePersonalizzazione || "");

  const salvaAll = async () => {
    await onSave({
      colorePrincipale,
      coloreSecondario: coloriSecondari.length > 0 ? serializeColoriSecondari(coloriSecondari) : null,
      notePersonalizzazione,
    });
  };

  useImperativeHandle(ref, () => ({ save: salvaAll }));

  const aggiungiLogo = async () => {
    if (loghiDisponibili.length === 0) return;
    const logo = loghiDisponibili[0];
    const res = await fetch(`/api/schede/${scheda.id}/loghi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoId: logo.id, posizione: POSIZIONI_LOGO[0], tecnica: TECNICHE_LOGO[0] }),
    });
    const nuovoLogo = await res.json();
    setLoghi((prev) => [...prev, nuovoLogo]);
  };

  const rimuoviLogo = async (logoSchedaId: string) => {
    await fetch(`/api/schede/${scheda.id}/loghi/${logoSchedaId}`, { method: "DELETE" });
    setLoghi((prev) => prev.filter((l) => l.id !== logoSchedaId));
  };

  const aggiornaLogo = async (logoSchedaId: string, field: string, value: string) => {
    setLoghi((prev) => prev.map((l) => (l.id === logoSchedaId ? { ...l, [field]: value } : l)));
    await fetch(`/api/schede/${scheda.id}/loghi/${logoSchedaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  };

  // --- Colori secondari multipli ---

  const aggiungiColoreSecondario = () => {
    setColoriSecondari((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), colore: "", destinazione: "", altroTesto: "" },
    ]);
  };

  const rimuoviColoreSecondario = (id: string) => {
    const aggiornate = coloriSecondari.filter((v) => v.id !== id);
    setColoriSecondari(aggiornate);
    onSave({ coloreSecondario: aggiornate.length > 0 ? serializeColoriSecondari(aggiornate) : null });
  };

  const aggiornaColoreSecondario = (
    id: string,
    field: keyof Omit<ColoreSecondarioVoce, "id">,
    val: string
  ) => {
    const aggiornate = coloriSecondari.map((v) => (v.id === id ? { ...v, [field]: val } : v));
    setColoriSecondari(aggiornate);
    return aggiornate;
  };

  const salvaColoreSecondario = (aggiornate: ColoreSecondarioVoce[]) => {
    onSave({ coloreSecondario: aggiornate.length > 0 ? serializeColoriSecondari(aggiornate) : null });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        {/* Loghi applicati */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Loghi applicati</h3>
            <a
              href="/loghi/nuovo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={12} /> Libreria loghi
            </a>
          </div>

          <div className="space-y-3 mb-4">
            {loghi.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-sm text-gray-400 mb-2">Nessun logo aggiunto</div>
                {loghiDisponibili.length === 0 ? (
                  <a
                    href="/loghi/nuovo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Aggiungi loghi alla libreria →
                  </a>
                ) : (
                  <button onClick={aggiungiLogo} className="text-xs text-blue-600 hover:underline">
                    Aggiungi il primo logo
                  </button>
                )}
              </div>
            ) : (
              loghi.map((l) => (
                <div key={l.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {l.logo?.file ? (
                        <img
                          src={l.logo.file}
                          alt={l.logo.nome}
                          className="w-8 h-8 object-contain rounded bg-gray-50 border border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                          {l.logo?.nome?.[0] || "L"}
                        </div>
                      )}
                      <div>
                        <select
                          value={l.logoId}
                          onChange={(e) => aggiornaLogo(l.id, "logoId", e.target.value)}
                          className="text-sm font-medium text-gray-700 bg-transparent border-0 p-0"
                        >
                          {loghiDisponibili.map((logo) => (
                            <option key={logo.id} value={logo.id}>
                              {logo.nome}
                            </option>
                          ))}
                        </select>
                        <div className="text-xs text-gray-400">
                          <select
                            value={l.tecnica}
                            onChange={(e) => aggiornaLogo(l.id, "tecnica", e.target.value)}
                            className="text-xs text-gray-500 bg-transparent border-0 p-0"
                          >
                            {TECNICHE_LOGO.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => rimuoviLogo(l.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Posizione</div>
                      <select
                        value={l.posizione}
                        onChange={(e) => aggiornaLogo(l.id, "posizione", e.target.value)}
                        className="w-full text-xs text-gray-600 border border-gray-200 rounded p-1"
                      >
                        {POSIZIONI_LOGO.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Dimensione</div>
                      <input
                        type="text"
                        value={l.dimensione || ""}
                        onChange={(e) => aggiornaLogo(l.id, "dimensione", e.target.value)}
                        placeholder="es. 8 cm"
                        className="w-full text-xs text-gray-600 border border-gray-200 rounded p-1"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {loghiDisponibili.length > 0 && (
            <button
              onClick={aggiungiLogo}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <PlusCircle size={15} />
              Aggiungi logo
            </button>
          )}
        </div>

        {/* Colori e note */}
        <div className="card space-y-4">
          <h3 className="section-title">Colori</h3>

          <div className="space-y-3">
            {/* Colore principale */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Colore principale</label>
              <ColorPickerNamed
                value={colorePrincipale}
                onChange={(val) => {
                  setColorePrincipale(val);
                  onSave({ colorePrincipale: val });
                }}
                placeholder="es. Blu royal"
              />
            </div>

            {/* Colori secondari multipli */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Colori secondari</label>

              {coloriSecondari.length === 0 ? (
                <div className="text-xs text-gray-300 italic mb-2">Nessun colore secondario</div>
              ) : (
                <div className="space-y-2 mb-2">
                  {coloriSecondari.map((voce) => (
                    <div
                      key={voce.id}
                      className="border border-gray-100 rounded-lg p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Colore secondario</span>
                        <button
                          onClick={() => rimuoviColoreSecondario(voce.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <ColorPickerNamed
                        value={voce.colore}
                        onChange={(val) => {
                          const aggiornate = aggiornaColoreSecondario(voce.id, "colore", val);
                          salvaColoreSecondario(aggiornate);
                        }}
                        placeholder="es. Bianco"
                      />
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Destinazione</div>
                        <select
                          value={voce.destinazione}
                          onChange={(e) => {
                            const aggiornate = aggiornaColoreSecondario(
                              voce.id,
                              "destinazione",
                              e.target.value
                            );
                            salvaColoreSecondario(aggiornate);
                          }}
                          className="w-full text-xs text-gray-600 border border-gray-200 rounded p-1.5"
                        >
                          <option value="">— Seleziona destinazione —</option>
                          {DESTINAZIONI_COLORE.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      {voce.destinazione === "Altro" && (
                        <input
                          type="text"
                          value={voce.altroTesto}
                          onChange={(e) =>
                            aggiornaColoreSecondario(voce.id, "altroTesto", e.target.value)
                          }
                          onBlur={() => salvaColoreSecondario(coloriSecondari)}
                          placeholder="Specifica destinazione..."
                          className="w-full text-xs text-gray-600 border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={aggiungiColoreSecondario}
                className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-1.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <PlusCircle size={13} />
                Aggiungi colore secondario
              </button>
            </div>
          </div>

          <div>
            <h3 className="section-title mb-2">Note personalizzazione</h3>
            <textarea
              value={notePersonalizzazione}
              onChange={(e) => setNotePersonalizzazione(e.target.value)}
              onBlur={() => onSave({ notePersonalizzazione })}
              rows={5}
              placeholder="es. Mantenere distanza minima 1 cm dalle cuciture..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none focus:border-blue-400 outline-none"
            />
          </div>
        </div>
      </div>

    </>
  );
});

export default TabPersonalizzazione;
