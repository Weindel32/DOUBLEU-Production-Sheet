"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Copy, CheckCircle, Trash2, Loader2, Save, AlertCircle, PackagePlus, ArrowUpRight } from "lucide-react";
import {
  STATI_SCHEDA, StatoScheda, TIPI_SCHEDA, normalizzaTipo, baseScheda, formatData, formatOra, formatEuro,
  calcolaTotaleQuantita, totaleSviluppo, type RiepilogoCosti,
} from "@/lib/utils";
import TabArticolo, { type TabArticoloHandle } from "./TabArticolo";
import TabPersonalizzazione, { type TabPersonalizzazioneHandle } from "./TabPersonalizzazione";
import TabMisure, { type TabMisureHandle } from "./TabMisure";
import TabProduzione, { type TabProduzioneHandle } from "./TabProduzione";
import TabCampioni from "./TabCampioni";
import { Segmented } from "@/components/ui/Form";
import type { SchedaCompleta, QuantitaTaglia, Campione } from "@/types";
import type { ModelloBreve } from "@/components/modelli/CampoModello";
import type { VoceColore } from "@/lib/colori";

export interface SchedaCollegata {
  id: string;
  codice: string;
  nomeArticolo: string;
  stato: string;
  cliente?: string | null;
}

interface Props {
  scheda: SchedaCompleta;
  clientiDisponibili: { id: string; nome: string }[];
  loghiDisponibili: { id: string; nome: string; file: string; tipo: string }[];
  materialiDisponibili: { id: string; nome: string; tipo: string; costoMetro: number | null; prezzoKg: number | null; unitaMisura: string | null; peso: string | null; unitaPeso: string | null; larghezza: string | null; fornitore?: string | null; colori?: string | null; coloriNomi?: string | null }[];
  /** Ordine nato da un articolo di costo: l'articolo di partenza. */
  origine?: SchedaCollegata | null;
  /** Articolo di costo: gli ordini creati da lui. */
  ordiniCollegati?: SchedaCollegata[];
  modelli?: ModelloBreve[];
  vociColori?: VoceColore[];
}

const SEZIONI = [
  { id: "sez-articolo", label: "Articolo", soloOrdine: false },
  { id: "sez-personalizzazione", label: "Personalizzazione", soloOrdine: true },
  { id: "sez-misure", label: "Misure e quantità", soloOrdine: true },
  { id: "sez-costi", label: "Costi", soloOrdine: false },
  { id: "sez-produzione", label: "Produzione", soloOrdine: true },
  { id: "sez-campioni", label: "Campioni", soloOrdine: false },
];

const STATI_OPZIONI = STATI_SCHEDA.map((s) => ({ value: s.value, label: s.label }));

const RIEPILOGO_VUOTO: RiepilogoCosti = { materiali: 0, accessori: 0, lavorazioni: 0, totale: 0, prezzoVendita: 0, margine: null };

export default function SchedaDetail({ scheda, clientiDisponibili, loghiDisponibili, materialiDisponibili, origine, ordiniCollegati = [], modelli = [], vociColori = [] }: Props) {
  const router = useRouter();
  const tipo = normalizzaTipo(scheda.tipo);
  const isCosto = tipo === "costo";
  const base = baseScheda(tipo);
  const tipoInfo = TIPI_SCHEDA.find((t) => t.value === tipo)!;

  const [statoCorrente, setStatoCorrente] = useState<StatoScheda>(scheda.stato as StatoScheda);
  const [meta, setMeta] = useState({
    nomeArticolo: scheda.nomeArticolo, codice: scheda.codice, categoria: scheda.categoria || "", codiceModello: scheda.codiceModello || "",
  });
  const [savedAt, setSavedAt] = useState(formatOra(scheda.updatedAt));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [noteRapide, setNoteRapide] = useState(scheda.noteRapide || "");
  const [riepilogo, setRiepilogo] = useState<RiepilogoCosti>(RIEPILOGO_VUOTO);
  const [sviluppo, setSviluppo] = useState(() => {
    const c = (scheda.campioni as Campione[]) || [];
    return { totale: totaleSviluppo(c), numero: c.length };
  });
  const [quantita, setQuantita] = useState<QuantitaTaglia>((scheda.quantitaTaglia as QuantitaTaglia) || {});
  const [sezioneAttiva, setSezioneAttiva] = useState("sez-articolo");
  const [creandoOrdine, setCreandoOrdine] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabArticoloRef = useRef<TabArticoloHandle>(null);
  const tabPersonalizzazioneRef = useRef<TabPersonalizzazioneHandle>(null);
  const tabMisureRef = useRef<TabMisureHandle>(null);
  const tabProduzioneRef = useRef<TabProduzioneHandle>(null);

  const sezioni = SEZIONI.filter((s) => !s.soloOrdine || !isCosto);
  const totalePezzi = isCosto ? 0 : calcolaTotaleQuantita(quantita);

  // Evidenzia nell'indice la sezione che si sta leggendo.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visibile = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visibile) setSezioneAttiva(visibile.target.id);
      },
      { root, rootMargin: "-10% 0px -75% 0px" },
    );
    sezioni.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Link diretto a una sezione (es. nuovo articolo di costo → #sez-costi).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id.startsWith("sez-")) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 50);
  }, []);

  const vaiA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSezioneAttiva(id);
  };

  const handleSave = useCallback(async (data: Partial<SchedaCompleta>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/schede/${scheda.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError(body?.error || `Salvataggio non riuscito (errore ${res.status})`);
        return;
      }
      setSaveError(null);
      setSavedAt(formatOra(new Date()));
    } catch {
      setSaveError("Salvataggio non riuscito: controlla la connessione");
    } finally {
      setSaving(false);
    }
  }, [scheda.id]);

  const handleGlobalSave = useCallback(async () => {
    await Promise.all([
      tabArticoloRef.current?.save(),
      tabPersonalizzazioneRef.current?.save(),
      tabMisureRef.current?.save(),
      tabProduzioneRef.current?.save(),
    ]);
  }, []);

  const cambiaStato = async (nuovo: string) => {
    setStatoCorrente(nuovo as StatoScheda);
    await handleSave({ stato: nuovo });
  };

  const handleElimina = async () => {
    const avviso = ordiniCollegati.length > 0
      ? ` Gli ${ordiniCollegati.length} ordini creati da questo articolo restano, ma perdono il collegamento.`
      : "";
    if (!confirm(`Eliminare definitivamente "${meta.nomeArticolo}"? L'operazione non è reversibile.${avviso}`)) return;
    await fetch(`/api/schede/${scheda.id}`, { method: "DELETE" });
    router.push(base);
  };

  // Copia lato server dallo stato salvato: prima salvo tutto, così la copia include le ultime modifiche.
  const copia = async (modo: "ordine" | "duplica") => {
    await handleGlobalSave();
    const res = await fetch(`/api/schede/${scheda.id}/copia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modo }),
    });
    const nuova = await res.json().catch(() => ({}));
    if (!res.ok || !nuova.id) {
      setSaveError(nuova.error || (modo === "ordine" ? "Creazione ordine non riuscita" : "Duplicazione non riuscita"));
      return false;
    }
    window.location.href = `${baseScheda(nuova.tipo)}/${nuova.id}`;
    return true;
  };

  const creaOrdine = async () => {
    setCreandoOrdine(true);
    if (!(await copia("ordine"))) setCreandoOrdine(false);
  };

  const margineColore = riepilogo.margine === null ? "text-[#B7C4D8]"
    : riepilogo.margine >= 40 ? "text-[#8FD6B0]" : riepilogo.margine >= 30 ? "text-[#F0D58C]" : "text-[#F2A488]";
  const fmtMargine = riepilogo.margine === null ? "—" : `${riepilogo.margine.toFixed(1).replace(".", ",")}%`;
  const quote = riepilogo.totale > 0 ? [
    { label: "Materiali", v: riepilogo.materiali, c: "#E8A27E" },
    { label: "Accessori", v: riepilogo.accessori, c: "#F3D3BF" },
    { label: "Lavorazioni", v: riepilogo.lavorazioni, c: "#7F97BC" },
  ] : [];

  return (
    <div className="flex flex-col h-screen">

      {/* ── Intestazione ─────────────────────────────────── */}
      <header className="flex-shrink-0 bg-[#FBFAF7] border-b border-[#E4E0D6] px-6 py-3 flex flex-wrap lg:flex-nowrap items-center gap-3 xl:gap-4">
        <Link href={base} aria-label={isCosto ? "Torna ad articoli e costi" : "Torna alle schede produzione"}
          className="w-11 h-11 rounded-[10px] border border-[#D6D1C4] bg-white flex items-center justify-center text-[#0E1B2C] hover:border-[#0E1B2C]/40">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-[260px] lg:min-w-0">
          <div className="text-xs text-[#5F6878]">
            {meta.codiceModello && <><span className="font-mono font-semibold text-[#0E1B2C]">{meta.codiceModello}</span> · </>}
            <span className="font-mono">{meta.codice}</span>
            {scheda.cliente?.nome && <> · {scheda.cliente.nome}</>}
            {meta.categoria && <> · {meta.categoria}</>}
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0E1B2C] truncate">{meta.nomeArticolo}</h1>
            <span className={`badge badge-${tipo} flex-shrink-0`}>{tipoInfo.breve}</span>
          </div>
        </div>

        <Segmented options={STATI_OPZIONI} value={statoCorrente} onChange={cambiaStato} className="w-[190px] flex-shrink-0" />

        <div className="flex items-center gap-1.5 text-[13px] flex-shrink-0" aria-live="polite">
          {saving
            ? <><Loader2 size={15} className="animate-spin text-[#1F3A68]" /><span className="text-[#1F3A68] hidden xl:inline">Salvataggio…</span></>
            : saveError
              ? <><AlertCircle size={15} className="text-red-700" /><span className="text-red-700">Non salvato</span></>
              : <><CheckCircle size={15} className="text-[#1D6B4A]" /><span className="text-[#1D6B4A]"><span className="hidden xl:inline">Salvato </span>{savedAt}</span></>}
        </div>

        <button type="button" onClick={handleGlobalSave} disabled={saving} aria-label="Salva tutto"
          className="h-11 px-3 xl:px-4 flex-shrink-0 rounded-[10px] border border-[#D6D1C4] bg-white text-sm font-medium text-[#0E1B2C] flex items-center gap-2 hover:border-[#0E1B2C]/40 disabled:opacity-50">
          <Save size={16} /> <span className="hidden xl:inline">Salva</span>
        </button>
        {!isCosto && (
          <a href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`} target="_blank" rel="noreferrer"
            className="h-11 px-3 xl:px-4 flex-shrink-0 rounded-[10px] border border-[#D6D1C4] bg-white text-sm font-medium text-[#0E1B2C] flex items-center gap-2 hover:border-[#0E1B2C]/40">
            <FileDown size={16} /> <span><span className="hidden xl:inline">PDF </span>Produttore</span>
          </a>
        )}
        <a href={`/api/schede/${scheda.id}/pdf?tipo=interno`} target="_blank" rel="noreferrer"
          className="h-11 px-3 xl:px-4 flex-shrink-0 rounded-[10px] bg-[#0E1B2C] text-sm font-semibold text-white flex items-center gap-2 hover:bg-[#1F3A68]">
          <FileDown size={16} /> <span><span className="hidden xl:inline">PDF </span>Interno</span>
        </a>
      </header>

      {saveError && (
        <div role="alert" className="flex-shrink-0 bg-red-50 border-b border-red-200 text-red-800 text-sm px-6 py-2 flex items-center justify-between gap-3">
          <span>{saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} className="text-red-800 underline underline-offset-2">Chiudi</button>
        </div>
      )}

      {/* Indice orizzontale: schermi medi (iPad) */}
      <nav aria-label="Sezioni della scheda" className="2xl:hidden flex-shrink-0 border-b border-[#E4E0D6] bg-[#F6F4EF] px-6 py-2 flex gap-1.5 overflow-x-auto">
        {sezioni.map((s) => (
          <button key={s.id} type="button" onClick={() => vaiA(s.id)} aria-current={sezioneAttiva === s.id ? "location" : undefined}
            className={`h-10 px-4 rounded-full text-sm whitespace-nowrap transition-colors ${sezioneAttiva === s.id ? "bg-[#0E1B2C] text-white font-semibold" : "text-[#4A5566] hover:bg-[#0E1B2C]/5"}`}>
            {s.label}
          </button>
        ))}
      </nav>

      {/* ── Corpo: una sola pagina che scorre ─────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex gap-6 px-6 py-6 items-start">

          {/* Indice verticale: schermi larghi */}
          <nav aria-label="Sezioni della scheda" className="hidden 2xl:flex sticky top-6 w-48 flex-shrink-0 flex-col gap-1">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-[#5F6878] mb-2 ml-3">{isCosto ? "Articolo" : "Scheda"}</div>
            {sezioni.map((s) => (
              <button key={s.id} type="button" onClick={() => vaiA(s.id)} aria-current={sezioneAttiva === s.id ? "location" : undefined}
                className={`h-11 px-3 rounded-[10px] text-left text-sm transition-colors ${sezioneAttiva === s.id ? "bg-white text-[#0E1B2C] font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.08)]" : "text-[#4A5566] hover:bg-[#0E1B2C]/5"}`}>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Sezioni */}
          <div className="flex-1 min-w-0 space-y-10 pb-24">
            {origine && (
              <Link href={`/articoli/${origine.id}`}
                className="flex items-center justify-between gap-3 bg-[#FBEDE5] border border-[#F2D2C1] rounded-2xl px-5 py-3 text-sm text-[#0E1B2C] hover:border-[#A8461F]/40">
                <span>
                  Ordine creato dall&apos;articolo di costo{" "}
                  <span className="font-mono">{origine.codice}</span> · <span className="font-semibold">{origine.nomeArticolo}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#A8461F]">Apri articolo <ArrowUpRight size={15} /></span>
              </Link>
            )}

            <section id="sez-articolo" className="scheda-section">
              <TabArticolo ref={tabArticoloRef} scheda={scheda} onSave={handleSave} clienti={clientiDisponibili}
                materiali={materialiDisponibili} modelli={modelli} vociColori={vociColori} onMetaChange={(m) => setMeta((prev) => ({ ...prev, ...m }))} />
            </section>

            {!isCosto && (
              <>
                <section id="sez-personalizzazione" className="scheda-section space-y-4">
                  <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Personalizzazione</h2>
                  <TabPersonalizzazione ref={tabPersonalizzazioneRef} scheda={scheda} onSave={handleSave} loghiDisponibili={loghiDisponibili} />
                </section>

                <section id="sez-misure" className="scheda-section space-y-4">
                  <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Misure e quantità</h2>
                  <TabMisure ref={tabMisureRef} scheda={scheda} onSave={handleSave} onQuantitaChange={setQuantita} />
                </section>
              </>
            )}

            <TabProduzione ref={tabProduzioneRef} scheda={scheda} onSave={handleSave} materialiDisponibili={materialiDisponibili}
              soloCosti={isCosto} onRiepilogoChange={setRiepilogo} />

            <section id="sez-campioni" className="scheda-section">
              <TabCampioni scheda={scheda} onSave={handleSave} onTotaleChange={(totale, numero) => setSviluppo({ totale, numero })} />
            </section>
          </div>

          {/* ── Riepilogo fisso ─────────────────────────── */}
          <aside aria-label="Riepilogo" className="hidden lg:flex sticky top-6 w-[290px] flex-shrink-0 flex-col gap-4">
            <div className="bg-[#0E1B2C] text-white rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#B7C4D8]">Costo per capo</span>
                <span className="text-[11px] text-[#B7C4D8]">solo interno</span>
              </div>
              <div className="font-mono text-[40px] font-semibold leading-none tracking-tight">{formatEuro(riepilogo.totale)}</div>
              {quote.length > 0 && (
                <>
                  <div className="flex h-2.5 rounded overflow-hidden gap-0.5" aria-hidden>
                    {quote.filter((q) => q.v > 0).map((q) => (
                      <div key={q.label} style={{ width: `${(q.v / riepilogo.totale) * 100}%`, background: q.c }} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    {quote.map((q) => (
                      <div key={q.label} className="flex justify-between">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: q.c }} />{q.label}</span>
                        <span className="font-mono">{formatEuro(q.v)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="h-px bg-white/15" />
              <div className="flex justify-between text-sm">
                <span className="text-[#B7C4D8]">Prezzo vendita</span>
                <span className="font-mono">{riepilogo.prezzoVendita > 0 ? formatEuro(riepilogo.prezzoVendita) : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-[#B7C4D8]">Margine</span>
                <span className={`font-mono text-2xl font-semibold ${margineColore}`}>{fmtMargine}</span>
              </div>
              {totalePezzi > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#B7C4D8]">Ordine · {totalePezzi} pz</span>
                  <span className="font-mono">{formatEuro(riepilogo.totale * totalePezzi)}</span>
                </div>
              )}
              <button type="button" onClick={() => vaiA("sez-costi")}
                className="h-11 rounded-[10px] bg-white text-[#0E1B2C] text-sm font-semibold hover:bg-[#F6F4EF]">
                Vai ai costi
              </button>
            </div>

            {/* Sviluppo: separato e fuori dal costo per capo */}
            <button type="button" onClick={() => vaiA("sez-campioni")}
              className="text-left bg-white border border-[#E4E0D6] rounded-2xl p-4 flex flex-col gap-1.5 hover:border-[#1F3A68]/40">
              <span className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5F6878]">Sviluppo campioni</span>
                <span className="text-[11px] text-[#5F6878]">fuori dal costo/capo</span>
              </span>
              <span className="font-mono text-2xl font-semibold text-[#1F3A68]">{formatEuro(sviluppo.totale)}</span>
              <span className="text-xs text-[#5F6878]">
                {sviluppo.numero === 0 ? "Nessun campione registrato" : `${sviluppo.numero} ${sviluppo.numero === 1 ? "campione" : "campioni"}`}
              </span>
            </button>

            {isCosto && (
              <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 flex flex-col gap-3">
                <button type="button" onClick={creaOrdine} disabled={creandoOrdine}
                  className="h-12 rounded-[10px] bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {creandoOrdine ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
                  Crea ordine da questo articolo
                </button>
                <p className="text-xs text-[#5F6878] leading-snug">
                  Nuova scheda di produzione con tessuto, costi e foto già compilati. L&apos;articolo resta qui.
                </p>
                {ordiniCollegati.length > 0 && (
                  <div className="border-t border-[#EFEBE2] pt-3 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5F6878] mb-1">
                      Ordini da questo articolo · {ordiniCollegati.length}
                    </span>
                    {ordiniCollegati.map((o) => (
                      <Link key={o.id} href={`/schede/${o.id}`}
                        className="flex items-center justify-between gap-2 min-h-11 px-2 -mx-2 rounded-lg text-sm hover:bg-[#FBFAF7]">
                        <span className="min-w-0">
                          <span className="font-mono text-xs text-[#0E1B2C]">{o.codice}</span>
                          <span className="block text-[#4A5566] truncate">{o.cliente || "Senza cliente"}</span>
                        </span>
                        <span className={`badge badge-${o.stato} flex-shrink-0`}>{STATI_SCHEDA.find((s) => s.value === o.stato)?.label ?? o.stato}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label className="bg-white border border-[#E4E0D6] rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#5F6878]">Note rapide</span>
              <textarea value={noteRapide} onChange={(e) => setNoteRapide(e.target.value)} onBlur={() => handleSave({ noteRapide })}
                rows={4} placeholder="Promemoria veloci…"
                className="w-full text-sm border border-[#D6D1C4] rounded-[10px] p-2.5 resize-none" />
            </label>

            <div className="flex flex-col gap-2 text-xs text-[#5F6878] px-1">
              <span>Creata da {scheda.createdBy} · {formatData(scheda.createdAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => copia("duplica")}
                className="h-11 rounded-[10px] border border-[#D6D1C4] bg-white text-sm font-medium text-[#0E1B2C] flex items-center justify-center gap-2 hover:border-[#0E1B2C]/40">
                <Copy size={15} /> Duplica
              </button>
              <button type="button" onClick={handleElimina}
                className="h-11 rounded-[10px] border border-red-200 bg-white text-sm font-medium text-red-700 flex items-center justify-center gap-2 hover:bg-red-50">
                <Trash2 size={15} /> Elimina
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Riepilogo compatto: schermi stretti (iPad verticale) */}
      <div className="lg:hidden flex-shrink-0 bg-[#0E1B2C] text-white px-6 py-3 flex items-center gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#B7C4D8]">Costo / capo</div>
          <div className="font-mono text-xl font-semibold">{formatEuro(riepilogo.totale)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#B7C4D8]">Margine</div>
          <div className={`font-mono text-xl font-semibold ${margineColore}`}>{fmtMargine}</div>
        </div>
        {totalePezzi > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#B7C4D8]">Ordine · {totalePezzi} pz</div>
            <div className="font-mono text-xl font-semibold">{formatEuro(riepilogo.totale * totalePezzi)}</div>
          </div>
        )}
        <div className="flex-1" />
        {isCosto && (
          <button type="button" onClick={creaOrdine} disabled={creandoOrdine}
            className="h-11 px-4 rounded-[10px] border border-white/40 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            <PackagePlus size={16} /> Crea ordine
          </button>
        )}
        <button type="button" onClick={() => vaiA("sez-costi")} className="h-11 px-4 rounded-[10px] bg-white text-[#0E1B2C] text-sm font-semibold">
          Costi
        </button>
      </div>
    </div>
  );
}
