"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Loader2, Save, ExternalLink } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  const salvaAll = async () => {
    setSaving(true);
    await onSave({ colorePrincipale, coloreSecondario, notePersonalizzazione });
    setSaving(false);
  };

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

  const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

  return (
    <>
    <div className="grid grid-cols-2 gap-5">
      {/* Loghi applicati */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Loghi applicati</h3>
          <a href="/loghi/nuovo" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
            <ExternalLink size={12} /> Libreria loghi
          </a>
        </div>

        <div className="space-y-3 mb-4">
          {loghi.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-gray-400 mb-2">Nessun logo aggiunto</div>
              {loghiDisponibili.length === 0 ? (
                <a href="/loghi/nuovo" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline">
                  Aggiungi loghi alla libreria →
                </a>
              ) : (
                <button onClick={aggiungiLogo}
                  className="text-xs text-blue-600 hover:underline">
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
                      <img src={l.logo.file} alt={l.logo.nome} className="w-8 h-8 object-contain rounded bg-gray-50 border border-gray-100" />
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
          <div>
            <label className="text-xs text-gray-400 block mb-1">Colore principale</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <input
                type="color"
                value={isHex(colorePrincipale) ? colorePrincipale : "#1e3a8a"}
                onChange={(e) => setColorePrincipale(e.target.value)}
                onBlur={() => onSave({ colorePrincipale })}
                className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={colorePrincipale}
                onChange={(e) => setColorePrincipale(e.target.value)}
                onBlur={() => onSave({ colorePrincipale })}
                placeholder="es. Blu royal o #1e3a8a"
                className="text-sm text-gray-700 flex-1 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Colore secondario</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <input
                type="color"
                value={isHex(coloreSecondario) ? coloreSecondario : "#172554"}
                onChange={(e) => setColoreSecondario(e.target.value)}
                onBlur={() => onSave({ coloreSecondario })}
                className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={coloreSecondario}
                onChange={(e) => setColoreSecondario(e.target.value)}
                onBlur={() => onSave({ coloreSecondario })}
                placeholder="es. Bianco o #ffffff"
                className="text-sm text-gray-700 flex-1 outline-none"
              />
            </div>
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

    <div className="flex justify-end pt-2">
      <button
        onClick={salvaAll}
        disabled={saving}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Salvataggio..." : "Salva"}
      </button>
    </div>
    </>
  );
}
