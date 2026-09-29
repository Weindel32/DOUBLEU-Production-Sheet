"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CATEGORIE, TIPI_SCHEDA, normalizzaTipo, baseScheda, type TipoScheda } from "@/lib/utils";
import { Field, ChipGroup, Segmented, inputCls } from "@/components/ui/Form";

const DESCRIZIONE_TIPO: Record<TipoScheda, string> = {
  costo: "Il costo per capo di un articolo, da usare per preventivi e ordini. Qui registri anche i campioni.",
  produzione: "Scheda completa per il produttore: misure, quantità per taglia, personalizzazioni, PDF.",
};

const GENERI = ["Unisex", "Uomo", "Donna", "Junior"].map((v) => ({ value: v, label: v }));
const VESTIBILITA = [
  { value: "Regular Fit", label: "Regular" }, { value: "Slim Fit", label: "Slim" },
  { value: "Loose Fit", label: "Loose" }, { value: "Athletic Fit", label: "Athletic" },
];

function NuovaSchedaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Precompilazione da "Modelli base" (?codice=&nome=&categoria=&fascia=): letta una volta al primo render.
  const [form, setForm] = useState(() => {
    const codice = searchParams.get("codice");
    const nome = searchParams.get("nome");
    const fascia = searchParams.get("fascia");
    return {
      tipo: normalizzaTipo(searchParams.get("tipo")),
      codice: "",
      nomeArticolo: nome ? (codice ? `${codice} – ${nome}` : nome) : "",
      categoria: searchParams.get("categoria") || "",
      collezione: "",
      vestibilita: "Regular Fit",
      genere: fascia === "Kids" ? "Junior" : fascia === "Donna" ? "Donna" : fascia === "Uomo" ? "Uomo" : "Unisex",
    };
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schede", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, codice: form.codice.trim(), stato: "bozza", versione: "1.0" }),
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
      <p className="text-sm text-[#5F6878] mt-1 mb-6">Tre campi e sei dentro. Il resto lo completi nella scheda.</p>

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

        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-3">
          <Field label="Codice" hint="Vuoto = automatico">
            <input type="text" value={form.codice} onChange={(e) => set("codice", e.target.value)}
              placeholder="auto" autoCapitalize="characters" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Nome articolo *">
            <input required autoFocus type="text" value={form.nomeArticolo} onChange={(e) => set("nomeArticolo", e.target.value)}
              placeholder="es. Felpa zip Academy" className={inputCls} />
          </Field>
        </div>

        <ChipGroup label="Categoria" options={CATEGORIE} value={form.categoria} onChange={(v) => set("categoria", v)} />

        <div className="grid grid-cols-2 gap-4">
          <Segmented label="Genere" options={GENERI} value={form.genere} onChange={(v) => set("genere", v)} />
          <Segmented label="Vestibilità" options={VESTIBILITA} value={form.vestibilita} onChange={(v) => set("vestibilita", v)} />
        </div>

        <Field label="Collezione">
          <input type="text" value={form.collezione} onChange={(e) => set("collezione", e.target.value)}
            placeholder="es. SS26" className={inputCls} />
        </Field>

        {error && (
          <div role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#EFEBE2]">
          <Link href="/modelli" className="text-sm font-medium text-[#1F3A68] h-11 inline-flex items-center">
            Parti da un modello base
          </Link>
          <div className="flex gap-2">
            <Link href="/schede" className="h-12 px-5 rounded-xl text-[15px] font-medium text-[#0E1B2C] inline-flex items-center hover:bg-[#0E1B2C]/5">
              Annulla
            </Link>
            <button type="submit" disabled={loading || !form.nomeArticolo.trim()}
              className="h-12 px-6 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2 disabled:opacity-50">
              {loading ? "Creazione…" : form.tipo === "costo" ? "Crea e vai ai costi" : "Crea scheda"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NuovaSchedaPage() {
  return (
    <Suspense>
      <NuovaSchedaForm />
    </Suspense>
  );
}
