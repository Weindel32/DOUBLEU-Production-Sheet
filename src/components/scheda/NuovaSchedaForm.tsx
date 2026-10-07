"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  CATEGORIE, TIPI_SCHEDA, baseScheda, formatEuro, genereDaFascia, fasciaDaGenere, ordinaCategorie, type TipoScheda,
} from "@/lib/utils";
import { Field, ChipGroup, Segmented, inputCls } from "@/components/ui/Form";
import CampoModello, { trovaModello, type ModelloBreve } from "@/components/modelli/CampoModello";
import type { CostoModello } from "@/lib/costiModelli";

const DESCRIZIONE_TIPO: Record<TipoScheda, string> = {
  costo: "Il costo per capo di un articolo, da usare per preventivi e ordini. Qui registri anche i campioni.",
  produzione: "Scheda completa per il produttore: misure, quantità per taglia, personalizzazioni, PDF.",
};

const GENERI = ["Unisex", "Uomo", "Donna", "Junior"].map((v) => ({ value: v, label: v }));
const VESTIBILITA = [
  { value: "Regular Fit", label: "Regular" }, { value: "Slim Fit", label: "Slim" },
  { value: "Loose Fit", label: "Loose" }, { value: "Athletic Fit", label: "Athletic" },
];

export default function NuovaSchedaForm({ tipoIniziale, modelloIniziale, modelli, costiEsistenti = {} }: {
  tipoIniziale: TipoScheda;
  modelloIniziale: string;
  modelli: ModelloBreve[];
  /** Articoli di costo già creati, per codice modello (minuscolo): avvisano prima di un doppione. */
  costiEsistenti?: Record<string, CostoModello[]>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(() => {
    const m = trovaModello(modelli, modelloIniziale);
    return {
      tipo: tipoIniziale,
      codice: "",
      codiceModello: m?.codice ?? modelloIniziale,
      nomeArticolo: m?.descrizione ?? "",
      categoria: m?.categoria ?? "",
      collezione: "",
      vestibilita: "Regular Fit",
      genere: m ? genereDaFascia(m.fascia) : "Unisex",
    };
  });
  // Il nome proposto dal modello si aggiorna cambiando modello, ma solo finché non lo si riscrive a mano.
  const [nomeDalModello, setNomeDalModello] = useState(() => !!trovaModello(modelli, modelloIniziale));
  const [aggiungiModello, setAggiungiModello] = useState(true);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Costo articolo per un modello che ne ha già uno: si propone di aprire quello.
  const doppioni = form.tipo === "costo" ? costiEsistenti[form.codiceModello.trim().toLowerCase()] ?? [] : [];

  const cambiaModello = (v: string) => {
    const m = trovaModello(modelli, v);
    setForm((f) => ({
      ...f,
      codiceModello: v,
      ...(m ? {
        codiceModello: m.codice,
        categoria: m.categoria,
        genere: genereDaFascia(m.fascia),
        nomeArticolo: nomeDalModello || !f.nomeArticolo.trim() ? m.descrizione : f.nomeArticolo,
      } : {}),
    }));
    if (m && (nomeDalModello || !form.nomeArticolo.trim())) setNomeDalModello(true);
  };

  const modelloNuovo = form.codiceModello.trim() !== "" && !trovaModello(modelli, form.codiceModello);
  const categorie = ordinaCategorie([...CATEGORIE, ...modelli.map((m) => m.categoria)]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Un codice modello nuovo entra in archivio prima della scheda, con i dati appena scritti.
      if (modelloNuovo && aggiungiModello) {
        if (!form.categoria) { setError("Scegli la categoria: serve anche per il nuovo modello."); setLoading(false); return; }
        const r = await fetch("/api/modelli", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codice: form.codiceModello.trim(), descrizione: form.nomeArticolo.trim(),
            categoria: form.categoria, fascia: fasciaDaGenere(form.genere),
          }),
        });
        if (!r.ok && r.status !== 409) {
          const b = await r.json().catch(() => ({}));
          setError(b.error || "Non sono riuscito ad aggiungere il modello all'archivio.");
          setLoading(false);
          return;
        }
      }
      const res = await fetch("/api/schede", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, codice: form.codice.trim(), codiceModello: form.codiceModello.trim() || null, stato: "bozza", versione: "1.0",
        }),
      });
      const scheda = await res.json();
      if (!res.ok || !scheda.id) {
        setError(scheda.error || "Errore nella creazione della scheda. Riprova.");
        setLoading(false);
        return;
      }
      // Un articolo di costo si apre direttamente sui costi: è il motivo per cui lo si crea.
      router.push(`${baseScheda(form.tipo)}/${scheda.id}${form.tipo === "costo" ? "#sez-costi" : ""}`);
    } catch {
      setError("Errore di rete. Controlla la connessione e riprova.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <Link href={baseScheda(form.tipo)} className="inline-flex items-center gap-2 h-11 text-sm text-[#4A5566] hover:text-[#0E1B2C] mb-2">
        <ArrowLeft size={16} /> {form.tipo === "costo" ? "Articoli e costi" : "Schede produzione"}
      </Link>

      <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0E1B2C]">Nuova scheda</h1>
      <p className="text-sm text-[#5F6878] mt-1 mb-6">Scegli il modello e sei dentro. Il resto lo completi nella scheda.</p>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E4E0D6] rounded-2xl p-6 space-y-6">
        <div role="group" aria-label="Tipo di scheda" className="grid grid-cols-2 gap-3">
          {TIPI_SCHEDA.map((t) => {
            const on = form.tipo === t.value;
            return (
              <button key={t.value} type="button" aria-pressed={on} onClick={() => set("tipo", t.value)}
                className={`text-left rounded-2xl p-4 flex flex-col gap-2 transition-colors ${on ? "border-2 border-[#0E1B2C] bg-[#FBFAF7]" : "border border-[#D6D1C4] bg-white p-[17px] hover:border-[#0E1B2C]/40"}`}>
                <span className="flex items-center justify-between">
                  <span className="font-display font-bold text-[17px] text-[#0E1B2C]">{t.label}</span>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${on ? "bg-[#0E1B2C] text-white" : "border-2 border-[#C9C3B5]"}`}>
                    {on && <Check size={14} strokeWidth={3} />}
                  </span>
                </span>
                <span className="text-sm text-[#4A5566] leading-snug">{DESCRIZIONE_TIPO[t.value]}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 items-start">
          <div className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
            <label htmlFor="nuova-modello">Modello (modellista)</label>
            <CampoModello id="nuova-modello" value={form.codiceModello} onChange={cambiaModello} modelli={modelli}
              categoria={form.categoria} genere={form.genere} />
          </div>
          <Field label="Nome articolo *">
            <input required autoFocus={!form.nomeArticolo} type="text" value={form.nomeArticolo}
              onChange={(e) => { set("nomeArticolo", e.target.value); setNomeDalModello(false); }}
              placeholder="es. Felpa zip Academy" className={inputCls} />
          </Field>
        </div>

        {modelloNuovo && (
          <label className="flex items-start gap-3 rounded-[10px] bg-[#FBEDE5] border border-[#F2D2C1] px-4 py-3 text-sm text-[#0E1B2C] cursor-pointer">
            <input type="checkbox" checked={aggiungiModello} onChange={(e) => setAggiungiModello(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#0E1B2C]" />
            <span>
              <strong className="font-mono">{form.codiceModello.trim()}</strong> non è ancora tra i Modelli.
              Aggiungilo all&apos;archivio con nome, categoria e fascia di questa scheda.
            </span>
          </label>
        )}

        <ChipGroup label="Categoria" options={categorie} value={form.categoria} onChange={(v) => set("categoria", v)} />

        <div className="grid grid-cols-2 gap-4">
          <Segmented label="Genere" options={GENERI} value={form.genere} onChange={(v) => set("genere", v)} />
          <Segmented label="Vestibilità" options={VESTIBILITA} value={form.vestibilita} onChange={(v) => set("vestibilita", v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Codice scheda" hint="Vuoto = automatico">
            <input type="text" value={form.codice} onChange={(e) => set("codice", e.target.value)}
              placeholder="auto" autoCapitalize="characters" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Collezione">
            <input type="text" value={form.collezione} onChange={(e) => set("collezione", e.target.value)}
              placeholder="es. SS26" className={inputCls} />
          </Field>
        </div>

        {doppioni.length > 0 && (
          <div role="alert" className="rounded-xl border border-[#E8C98A] bg-[#FBF3DF] px-4 py-3 space-y-2">
            <p className="text-sm text-[#7A5B12]">
              <span className="font-semibold">{form.codiceModello.trim()}</span> ha già {doppioni.length === 1 ? "un costo articolo" : `${doppioni.length} costi articolo`}.
              Di solito basta aprire quello; creane un altro solo se cambia davvero qualcosa (es. un tessuto diverso).
            </p>
            <div className="flex flex-wrap gap-2">
              {doppioni.map((c) => (
                <Link key={c.id} href={`/articoli/${c.id}`}
                  className="h-10 px-3 rounded-lg bg-white border border-[#E8C98A] text-[13px] font-semibold text-[#0E1B2C] inline-flex items-center gap-1.5 hover:border-[#7A5B12]">
                  Apri {c.nome}{c.totale > 0 && <span className="font-mono font-normal"> · {formatEuro(c.totale)}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#EFEBE2]">
          <Link href="/modelli" className="text-sm font-medium text-[#1F3A68] h-11 inline-flex items-center">
            Sfoglia i modelli
          </Link>
          <div className="flex gap-2">
            <Link href={baseScheda(form.tipo)} className="h-12 px-5 rounded-xl text-[15px] font-medium text-[#0E1B2C] inline-flex items-center hover:bg-[#0E1B2C]/5">
              Annulla
            </Link>
            <button type="submit" disabled={loading || !form.nomeArticolo.trim()}
              className="h-12 px-6 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2 disabled:opacity-50">
              {loading ? "Creazione…" : doppioni.length > 0 ? "Crea comunque" : form.tipo === "costo" ? "Crea e vai ai costi" : "Crea scheda"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
