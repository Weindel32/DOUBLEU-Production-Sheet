"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Copy, CheckCircle, ChevronDown, Trash2, Loader2, FileText, Palette, Ruler, Settings2 } from "lucide-react";
import { STATI_SCHEDA, StatoScheda, formatData, formatOra, calcolaTotaleQuantita } from "@/lib/utils";
import TabArticolo from "./TabArticolo";
import TabPersonalizzazione from "./TabPersonalizzazione";
import TabMisure from "./TabMisure";
import TabProduzione from "./TabProduzione";
import type { SchedaCompleta } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  clientiDisponibili: { id: string; nome: string }[];
  loghiDisponibili: { id: string; nome: string; file: string; tipo: string }[];
  materialiDisponibili: { id: string; nome: string; tipo: string; costoMetro: number | null; unitaMisura: string | null; peso: string | null; unitaPeso: string | null; larghezza: string | null }[];
}

const TABS = [
  { id: "articolo",          label: "Articolo",          icon: FileText },
  { id: "personalizzazione", label: "Personalizzazione",  icon: Palette },
  { id: "misure",            label: "Misure & Quantità",  icon: Ruler },
  { id: "produzione",        label: "Produzione & Note",  icon: Settings2 },
];

export default function SchedaDetail({ scheda, clientiDisponibili, loghiDisponibili, materialiDisponibili }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("articolo");
  const [statoCorrente, setStatoCorrente] = useState<StatoScheda>(scheda.stato as StatoScheda);
  const [savedAt, setSavedAt] = useState(formatOra(scheda.updatedAt));
  const [saving, setSaving] = useState(false);
  const [showStatoMenu, setShowStatoMenu] = useState(false);
  const [noteRapide, setNoteRapide] = useState(scheda.noteRapide || "");

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

  const handleStatoChange = async (nuovoStato: StatoScheda) => {
    setStatoCorrente(nuovoStato);
    setShowStatoMenu(false);
    await handleSave({ stato: nuovoStato });
  };

  const handleElimina = async () => {
    if (!confirm(`Eliminare definitivamente la scheda "${scheda.nomeArticolo}"? L'operazione non è reversibile.`)) return;
    await fetch(`/api/schede/${scheda.id}`, { method: "DELETE" });
    router.push("/schede");
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
    window.location.href = `/schede/${nuova.id}`;
  };

  const quantita = scheda.quantitaTaglia || {};
  const totale = calcolaTotaleQuantita(quantita as Record<string, number>);


  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0">
        <Link href="/schede" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={15} />
          Schede
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {saving
              ? <><Loader2 size={13} className="animate-spin text-blue-500" /><span className="text-blue-500">Salvataggio...</span></>
              : <><CheckCircle size={13} className="text-emerald-500" /><span>Salvato {savedAt}</span></>
            }
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-1">
            <a
              href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`}
              target="_blank"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-l-md text-xs font-medium transition-colors"
            >
              <FileDown size={13} />
              PDF Tecnico
            </a>
            <a
              href={`/api/schede/${scheda.id}/pdf?tipo=interno`}
              target="_blank"
              className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-r-md text-xs font-medium transition-colors"
            >
              PDF Interno
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Main content ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* Header scheda */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-6 pt-5 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1.5 font-medium">
                  Scheda produzione · {scheda.codice}
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white tracking-wide uppercase">
                    {scheda.nomeArticolo}
                  </h1>
                  {statoInfo && (
                    <span className={`badge badge-${statoCorrente}`}>{statoInfo.label}</span>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400 pt-1">
                <div>v{scheda.versione}</div>
                <div className="mt-0.5">{formatData(scheda.createdAt)}</div>
              </div>
            </div>

            {/* Meta strip */}
            <div className="flex gap-6 pb-4 border-b border-white/10">
              {[
                { label: "Cliente", value: scheda.cliente?.nome },
                { label: "Collezione", value: scheda.collezione },
                { label: "Categoria", value: scheda.categoria },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                  <div className="text-sm text-slate-200 font-medium mt-0.5">{value}</div>
                </div>
              ) : null)}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 pt-3">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap ${
                      active
                        ? "bg-white text-blue-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6 flex-1">
            {activeTab === "articolo" && (
              <TabArticolo scheda={scheda} onSave={handleSave} clienti={clientiDisponibili} materiali={materialiDisponibili} />
            )}
            {activeTab === "personalizzazione" && (
              <TabPersonalizzazione scheda={scheda} onSave={handleSave} loghiDisponibili={loghiDisponibili} />
            )}
            {activeTab === "misure" && (
              <TabMisure scheda={scheda} onSave={handleSave} />
            )}
            {activeTab === "produzione" && (
              <TabProduzione scheda={scheda} onSave={handleSave} materialiDisponibili={materialiDisponibili} />
            )}
          </div>
        </div>

        {/* ── Sidebar riepilogo ────────────────────────────── */}
        <div className="w-52 bg-slate-50 border-l border-gray-200 flex-shrink-0 overflow-y-auto flex flex-col">

          {/* Stato */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stato scheda</div>
            <div className="relative">
              <button
                onClick={() => setShowStatoMenu(!showStatoMenu)}
                className={`badge badge-${statoCorrente} w-full justify-between flex items-center gap-1 cursor-pointer`}
              >
                {statoInfo?.label}
                <ChevronDown size={11} />
              </button>
              {showStatoMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                  {STATI_SCHEDA.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatoChange(s.value as StatoScheda)}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <span className={`badge badge-${s.value}`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 border-b border-gray-200 space-y-2.5 text-xs">
            <div>
              <div className="text-gray-400 mb-0.5">Creato da</div>
              <div className="font-semibold text-gray-700">{scheda.createdBy}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">Ultima modifica</div>
              <div className="font-semibold text-gray-700">{formatData(scheda.updatedAt)}</div>
            </div>
            {totale > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <div className="text-blue-400 text-[10px] uppercase tracking-wider">Totale pezzi</div>
                <div className="font-bold text-blue-700 text-base mt-0.5">{totale} pz</div>
              </div>
            )}
            {statoCorrente === "bozza" && (
              <button
                onClick={() => handleStatoChange("esecutiva")}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Porta in Esecutiva
              </button>
            )}
          </div>

          {/* Note rapide */}
          <div className="p-4 border-b border-gray-200 flex-1">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Note rapide</div>
            <textarea
              value={noteRapide}
              onChange={(e) => setNoteRapide(e.target.value)}
              onBlur={() => handleSave({ noteRapide })}
              rows={5}
              placeholder="Note veloci..."
              className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none text-gray-700 bg-white focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Azioni */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleDuplica}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Copy size={13} />
              Duplica scheda
            </button>
            <button
              onClick={handleElimina}
              className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 size={13} />
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
