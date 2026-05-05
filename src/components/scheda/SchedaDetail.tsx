"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Copy, CheckCircle, ChevronDown, Trash2, Loader2 } from "lucide-react";
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
  { id: "articolo", label: "1. Articolo" },
  { id: "personalizzazione", label: "2. Personalizzazione" },
  { id: "misure", label: "3. Misure & Quantità" },
  { id: "produzione", label: "4. Produzione & Note" },
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

  const prossimeAzioni: Record<StatoScheda, string> = {
    bozza: "Inviare in revisione",
    revisione: "Approvare scheda",
    approvata: "Inviare in produzione",
    produzione: "Segnare come consegnata",
    consegnata: "Scheda completata",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <Link href="/schede" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={16} />
          Torna alle schede
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            {saving
              ? <><Loader2 size={15} className="animate-spin text-blue-500" /><span className="text-blue-600">Salvataggio...</span></>
              : <><CheckCircle size={15} className="text-green-500" /><span>Salvato {savedAt}</span></>
            }
          </div>
          <a
            href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`}
            target="_blank"
            className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <FileDown size={15} />
            Anteprima PDF
          </a>
          <div className="flex items-center gap-1">
            <a
              href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`}
              target="_blank"
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-l-lg text-sm transition-colors"
            >
              <FileDown size={15} />
              PDF Tecnico
            </a>
            <a
              href={`/api/schede/${scheda.id}/pdf?tipo=interno`}
              target="_blank"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-r-lg text-sm transition-colors"
            >
              PDF Interno
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header scheda */}
          <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Scheda produzione</div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                {scheda.nomeArticolo}
              </h1>
              {statoInfo && (
                <span className={`badge badge-${statoCorrente}`}>{statoInfo.label.toUpperCase()}</span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex gap-8 text-sm mb-4">
              <div>
                <div className="text-xs text-gray-400">Codice scheda</div>
                <div className="font-medium text-gray-700">{scheda.codice}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Cliente / Club</div>
                <div className="font-medium text-gray-700">{scheda.cliente?.nome || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Collezione</div>
                <div className="font-medium text-gray-700">{scheda.collezione || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Data creazione</div>
                <div className="font-medium text-gray-700">{formatData(scheda.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Versione</div>
                <div className="font-medium text-gray-700">{scheda.versione}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 -mx-6 px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-700 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                className="ml-auto px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Anteprima PDF
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
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

        {/* Sidebar riepilogo */}
        <div className="w-56 bg-white border-l border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Riepilogo</h3>

          {/* Stato */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Stato scheda</div>
            <div className="relative">
              <button
                onClick={() => setShowStatoMenu(!showStatoMenu)}
                className={`badge badge-${statoCorrente} w-full justify-between flex items-center gap-1`}
              >
                {statoInfo?.label.toUpperCase()}
                <ChevronDown size={12} />
              </button>
              {showStatoMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {STATI_SCHEDA.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatoChange(s.value as StatoScheda)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <span className={`badge badge-${s.value}`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline visivo */}
          <div className="mb-4 space-y-1.5">
            {STATI_SCHEDA.map((s) => {
              const idx = STATI_SCHEDA.findIndex((x) => x.value === s.value);
              const currentIdx = STATI_SCHEDA.findIndex((x) => x.value === statoCorrente);
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={s.value} className={`flex items-center gap-2 text-xs ${isDone ? "text-green-600" : isCurrent ? "text-blue-700 font-semibold" : "text-gray-300"}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? "bg-green-500" : isCurrent ? "bg-blue-700" : "bg-gray-200"}`} />
                  {s.label}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-3 mb-4 space-y-2 text-xs">
            <div>
              <div className="text-gray-400">Creato da</div>
              <div className="font-medium text-gray-700">{scheda.createdBy}</div>
            </div>
            <div>
              <div className="text-gray-400">Ultima modifica</div>
              <div className="font-medium text-gray-700">{formatData(scheda.updatedAt)} {formatOra(scheda.updatedAt)}</div>
            </div>
            {totale > 0 && (
              <div>
                <div className="text-gray-400">Totale pezzi</div>
                <div className="font-medium text-gray-700">{totale} pz</div>
              </div>
            )}
            <div>
              <div className="text-gray-400">Prossima azione</div>
              <div className="font-medium text-blue-700">{prossimeAzioni[statoCorrente]}</div>
            </div>
          </div>

          {/* Note rapide */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Note rapide</div>
            <textarea
              value={noteRapide}
              onChange={(e) => setNoteRapide(e.target.value)}
              onBlur={() => handleSave({ noteRapide })}
              rows={4}
              placeholder="Note veloci..."
              className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none text-gray-700 focus:border-blue-400 transition-colors"
            />
          </div>

          <button
            onClick={handleDuplica}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Copy size={14} />
            Duplica scheda
          </button>
          <button
            onClick={handleElimina}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
          >
            <Trash2 size={14} />
            Elimina scheda
          </button>
        </div>
      </div>
    </div>
  );
}
