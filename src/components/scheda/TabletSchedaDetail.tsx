"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileDown, Copy, Trash2, Loader2, FileText, Palette,
  Ruler, Settings2, Save, ChevronDown, CheckCircle, X, Info,
} from "lucide-react";
import { STATI_SCHEDA, StatoScheda, formatData, formatOra, calcolaTotaleQuantita } from "@/lib/utils";
import TabArticolo, { type TabArticoloHandle } from "./TabArticolo";
import TabPersonalizzazione, { type TabPersonalizzazioneHandle } from "./TabPersonalizzazione";
import TabMisure, { type TabMisureHandle } from "./TabMisure";
import TabProduzione, { type TabProduzioneHandle } from "./TabProduzione";
import type { SchedaCompleta } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  clientiDisponibili: { id: string; nome: string }[];
  loghiDisponibili: { id: string; nome: string; file: string; tipo: string }[];
  materialiDisponibili: { id: string; nome: string; tipo: string; costoMetro: number | null; unitaMisura: string | null; peso: string | null; unitaPeso: string | null; larghezza: string | null }[];
}

const TABS = [
  { id: "articolo",          label: "Articolo",      icon: FileText },
  { id: "personalizzazione", label: "Personaliz.",   icon: Palette },
  { id: "misure",            label: "Misure",         icon: Ruler },
  { id: "produzione",        label: "Produzione",    icon: Settings2 },
];

export default function TabletSchedaDetail({ scheda, clientiDisponibili, loghiDisponibili, materialiDisponibili }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("articolo");
  const [statoCorrente, setStatoCorrente] = useState<StatoScheda>(scheda.stato as StatoScheda);
  const [savedAt, setSavedAt] = useState(formatOra(scheda.updatedAt));
  const [saving, setSaving] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatoMenu, setShowStatoMenu] = useState(false);
  const [noteRapide, setNoteRapide] = useState(scheda.noteRapide || "");

  const tabArticoloRef = useRef<TabArticoloHandle>(null);
  const tabPersonalizzazioneRef = useRef<TabPersonalizzazioneHandle>(null);
  const tabMisureRef = useRef<TabMisureHandle>(null);
  const tabProduzioneRef = useRef<TabProduzioneHandle>(null);

  const statoInfo = STATI_SCHEDA.find((s) => s.value === statoCorrente);

  const handleSave = useCallback(async (data: Partial<SchedaCompleta>) => {
    setSaving(true);
    await fetch(`/api/schede/${scheda.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSavedAt(formatOra(new Date()));
  }, [scheda.id]);

  const handleGlobalSave = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        tabArticoloRef.current?.save(),
        tabPersonalizzazioneRef.current?.save(),
        tabMisureRef.current?.save(),
        tabProduzioneRef.current?.save(),
      ]);
      setSavedAt(formatOra(new Date()));
    } finally {
      setSaving(false);
    }
  }, []);

  const handleStatoChange = async (nuovoStato: StatoScheda) => {
    setStatoCorrente(nuovoStato);
    setShowStatoMenu(false);
    await handleSave({ stato: nuovoStato });
  };

  const handleElimina = async () => {
    if (!confirm(`Eliminare definitivamente la scheda "${scheda.nomeArticolo}"? L'operazione non è reversibile.`)) return;
    await fetch(`/api/schede/${scheda.id}`, { method: "DELETE" });
    router.push("/t/schede");
  };

  const handleDuplica = async () => {
    const res = await fetch("/api/schede", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...scheda,
        codice: `${scheda.codice}-COPIA`,
        nomeArticolo: `${scheda.nomeArticolo} (Copia)`,
        stato: "bozza",
        versione: "1.0",
      }),
    });
    const nuova = await res.json();
    window.location.href = `/t/schede/${nuova.id}`;
  };

  const quantita = scheda.quantitaTaglia || {};
  const totale = calcolaTotaleQuantita(quantita as Record<string, number>);

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── Article header ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-4 pt-4 pb-0 flex-shrink-0">
        <Link href="/t/schede" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3 transition-colors w-fit">
          <ArrowLeft size={15} />
          Schede
        </Link>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-medium">
              {scheda.codice}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-wide uppercase leading-tight">
                {scheda.nomeArticolo}
              </h1>
              {statoInfo && (
                <span className={`badge badge-${statoCorrente} flex-shrink-0`}>{statoInfo.label}</span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 flex-shrink-0 pt-1">
            <div>v{scheda.versione}</div>
            <div className="mt-0.5">{formatData(scheda.createdAt)}</div>
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex gap-4 pb-3 border-b border-white/10 flex-wrap">
          {[
            { label: "Cliente", value: scheda.cliente?.nome },
            { label: "Collezione", value: scheda.collezione },
            { label: "Categoria", value: scheda.categoria },
          ].map(({ label, value }) => value ? (
            <div key={label}>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
              <div className="text-xs text-slate-200 font-medium mt-0.5">{value}</div>
            </div>
          ) : null)}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pt-2 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap flex-shrink-0 ${
                  active
                    ? "bg-[#112240] text-blue-300"
                    : "text-slate-400 hover:text-slate-200 active:bg-white/5"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-16 p-4">
        <div style={{ display: activeTab === "articolo" ? undefined : "none" }}>
          <TabArticolo ref={tabArticoloRef} scheda={scheda} onSave={handleSave} clienti={clientiDisponibili} materiali={materialiDisponibili} />
        </div>
        <div style={{ display: activeTab === "personalizzazione" ? undefined : "none" }}>
          <TabPersonalizzazione ref={tabPersonalizzazioneRef} scheda={scheda} onSave={handleSave} loghiDisponibili={loghiDisponibili} />
        </div>
        <div style={{ display: activeTab === "misure" ? undefined : "none" }}>
          <TabMisure ref={tabMisureRef} scheda={scheda} onSave={handleSave} />
        </div>
        <div style={{ display: activeTab === "produzione" ? undefined : "none" }}>
          <TabProduzione ref={tabProduzioneRef} scheda={scheda} onSave={handleSave} materialiDisponibili={materialiDisponibili} />
        </div>
      </div>

      {/* ── Info drawer (bottom sheet) ─────────────────── */}
      {showInfoDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => { setShowInfoDrawer(false); setShowStatoMenu(false); }}
          />
          <div className="fixed bottom-14 left-0 right-0 z-40 bg-[#0a1628] border-t border-white/10 rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/7">
              <span className="text-sm font-semibold text-white">Informazioni scheda</span>
              <button
                onClick={() => { setShowInfoDrawer(false); setShowStatoMenu(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8ba3c7] hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">

              {/* Stato */}
              <div>
                <div className="text-[10px] font-bold text-[#4e6585] uppercase tracking-widest mb-2">Stato scheda</div>
                <div className="relative">
                  <button
                    onClick={() => setShowStatoMenu(!showStatoMenu)}
                    className={`badge badge-${statoCorrente} w-full justify-between flex items-center gap-1 cursor-pointer py-2 px-3`}
                  >
                    {statoInfo?.label}
                    <ChevronDown size={13} />
                  </button>
                  {showStatoMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#112240] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                      {STATI_SCHEDA.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => handleStatoChange(s.value as StatoScheda)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                        >
                          <span className={`badge badge-${s.value}`}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Porta in esecutiva shortcut */}
              {statoCorrente === "bozza" && (
                <button
                  onClick={() => { handleStatoChange("esecutiva"); setShowInfoDrawer(false); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Porta in Esecutiva
                </button>
              )}

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <div className="text-[#4e6585] mb-1">Creato da</div>
                  <div className="font-semibold text-white">{scheda.createdBy}</div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <div className="text-[#4e6585] mb-1">Ultima modifica</div>
                  <div className="font-semibold text-white">{formatData(scheda.updatedAt)}</div>
                </div>
                {totale > 0 && (
                  <div className="col-span-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <div className="text-blue-400 text-[10px] uppercase tracking-wider">Totale pezzi</div>
                    <div className="font-bold text-blue-300 text-xl mt-0.5">{totale} pz</div>
                  </div>
                )}
              </div>

              {/* Note rapide */}
              <div>
                <div className="text-[10px] font-bold text-[#4e6585] uppercase tracking-widest mb-2">Note rapide</div>
                <textarea
                  value={noteRapide}
                  onChange={(e) => setNoteRapide(e.target.value)}
                  onBlur={() => handleSave({ noteRapide })}
                  rows={4}
                  placeholder="Note veloci..."
                  className="w-full text-sm border border-white/10 rounded-xl p-3 resize-none text-[#e8edf4] bg-[#1a3060] focus:border-blue-500/40 outline-none"
                />
              </div>

              {/* Azioni */}
              <div className="space-y-2">
                <button
                  onClick={() => { setShowInfoDrawer(false); handleDuplica(); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Copy size={15} />
                  Duplica scheda
                </button>
                <button
                  onClick={handleElimina}
                  className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Trash2 size={15} />
                  Elimina scheda
                </button>
              </div>

              {/* Saved at */}
              <div className="text-center text-xs text-[#4e6585]">
                {saving
                  ? "Salvataggio in corso..."
                  : `Salvato alle ${savedAt}`
                }
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sticky bottom bar ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#0a1628] border-t border-white/7 flex items-center px-3 gap-2 z-20">
        <a
          href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`}
          target="_blank"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <FileDown size={13} />
          PDF Tec.
        </a>
        <a
          href={`/api/schede/${scheda.id}/pdf?tipo=interno`}
          target="_blank"
          className="flex items-center gap-1.5 bg-[#1a3060] hover:bg-[#162a4e] active:bg-[#112240] text-[#8ba3c7] px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          PDF Int.
        </a>

        <button
          onClick={() => { setShowInfoDrawer(!showInfoDrawer); setShowStatoMenu(false); }}
          className="flex items-center gap-1.5 bg-[#1a3060] hover:bg-[#162a4e] active:bg-[#112240] text-[#8ba3c7] px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        >
          <Info size={13} />
          Info
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 text-xs text-[#4e6585]">
          {saving
            ? <><Loader2 size={12} className="animate-spin text-blue-400" /><span className="text-blue-400">Salvataggio...</span></>
            : <><CheckCircle size={12} className="text-emerald-400" /><span>{savedAt}</span></>
          }
        </div>

        <button
          onClick={handleGlobalSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salva
        </button>
      </div>
    </div>
  );
}
