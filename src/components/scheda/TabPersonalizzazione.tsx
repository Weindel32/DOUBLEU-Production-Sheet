"use client";

import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { TECNICHE_LOGO, POSIZIONI_LOGO } from "@/lib/utils";
import type { SchedaCompleta, LogoSchedaCompleto } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  loghiDisponibili: { id: string; nome: string; file: string; tipo: string }[];
}

export default function TabPersonalizzazione({ scheda, onSave, loghiDisponibili }: Props) {
  const [loghi, setLoghi] = useState<LogoSchedaCompleto[]>(scheda.loghi || []);
  const [colorePrincipale, setColorePrincipale] = useState(scheda.colorePrincipale || "");
  const [coloreSecondario, setColoreSecondario] = useState(scheda.coloreSecondario || "");
  const [notePersonalizzazione, setNotePersonalizzazione] = useState(scheda.notePersonalizzazione || "");

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
    setLoghi((prev) => prev.map((l) => l.id === logoSchedaId ? { ...l, [field]: value } : l));
    await fetch(`/api/schede/${scheda.id}/loghi/${logoSchedaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  };

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Loghi applicati */}
      <div className="card col-span-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Loghi applicati</h3>
        </div>

        <div className="space-y-3 mb-4">
          {loghi.length === 0 ? (
            <div className="text-sm text-gray-400 italic text-center py-4">Nessun logo aggiunto</div>
          ) : (
            loghi.map((l) => (
              <div key={l.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                      {l.logo?.nome?.[0] || "L"}
                    </div>
                    <div>
                      <select
                        value={l.logoId}
                        onChange={(e) => aggiornaLogo(l.id, "logoId", e.target.value)}
                        className="text-sm font-medium text-gray-700 bg-transparent border-0 p-0"
                      >
                        {loghiDisponibili.map((logo) => (
                          <option key={logo.id} value={logo.id}>{logo.nome}</option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-400">
                        <select
                          value={l.tecnica}
                          onChange={(e) => aggiornaLogo(l.id, "tecnica", e.target.value)}
                          className="text-xs text-gray-500 bg-transparent border-0 p-0"
                        >
                          {TECNICHE_LOGO.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => rimuoviLogo(l.id)} className="text-gray-300 hover:text-red-400 transition-colors">
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
                      {POSIZIONI_LOGO.map((p) => <option key={p} value={p}>{p}</option>)}
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

        <button
          onClick={aggiungiLogo}
          disabled={loghiDisponibili.length === 0}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-40"
        >
          <PlusCircle size={15} />
          Aggiungi logo
        </button>
        {loghiDisponibili.length === 0 && (
          <p className="text-xs text-orange-500 mt-1 text-center">Prima aggiungi loghi alla libreria</p>
        )}
      </div>

      {/* Posizionamento visivo */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Posizionamento</h3>
        <div className="flex justify-center gap-6">
          {/* Fronte */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">Fronte</div>
            <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8 L10 20 L5 18 L2 35 L12 37 L12 90 L68 90 L68 37 L78 35 L75 18 L70 20 L60 8 L40 14 L20 8Z" fill="#1a2236" stroke="#374151" strokeWidth="1.5"/>
              <circle cx="30" cy="32" r="3" fill="#3b82f6" opacity="0.8"/>
              {loghi.find(l => l.posizione === "Lato cuore") && (
                <text x="26" y="35" fill="white" fontSize="6">L</text>
              )}
            </svg>
          </div>
          {/* Retro */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">Retro</div>
            <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 8 L10 20 L5 18 L2 35 L12 37 L12 90 L68 90 L68 37 L78 35 L75 18 L70 20 L60 8 L40 14 L20 8Z" fill="#1a2236" stroke="#374151" strokeWidth="1.5"/>
              <circle cx="40" cy="45" r="5" fill="#3b82f6" opacity="0.5"/>
              {loghi.find(l => l.posizione === "Retro centro") && (
                <text x="36" y="48" fill="white" fontSize="6">R</text>
              )}
            </svg>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {loghi.map((l) => (
            <div key={l.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">{l.logo?.nome}</span>
              <span className="text-gray-400">→ {l.posizione}</span>
              {l.dimensione && <span className="text-gray-400">({l.dimensione})</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Colori e note */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Colori</h3>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Colore principale</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: colorePrincipale || "#1e3a8a" }} />
              <input
                type="text"
                value={colorePrincipale}
                onChange={(e) => setColorePrincipale(e.target.value)}
                onBlur={() => onSave({ colorePrincipale })}
                placeholder="es. Blu royal"
                className="text-sm text-gray-700 flex-1 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Colore secondario</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: coloreSecondario || "#172554" }} />
              <input
                type="text"
                value={coloreSecondario}
                onChange={(e) => setColoreSecondario(e.target.value)}
                onBlur={() => onSave({ coloreSecondario })}
                placeholder="es. Blu navy"
                className="text-sm text-gray-700 flex-1 outline-none"
              />
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Note personalizzazione</h3>
        <textarea
          value={notePersonalizzazione}
          onChange={(e) => setNotePersonalizzazione(e.target.value)}
          onBlur={() => onSave({ notePersonalizzazione })}
          rows={4}
          placeholder="es. Mantenere distanza minima 1 cm dalle cuciture..."
          className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none focus:border-blue-400 outline-none"
        />
      </div>
    </div>
  );
}
