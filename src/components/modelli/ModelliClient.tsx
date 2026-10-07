"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, X, Calculator, FileText, Check } from "lucide-react";
import { CATEGORIE, FASCE_MODELLO, FASCIA_STYLE, ordinaCategorie } from "@/lib/utils";
import { Field, ChipGroup, Segmented, inputCls } from "@/components/ui/Form";
import type { CostoModello } from "@/lib/costiModelli";
import { formatEuro } from "@/lib/utils";

export interface ModelloRiga {
  id: string;
  codice: string;
  descrizione: string;
  categoria: string;
  fascia: string;
  note: string | null;
  articoli: number;
  ordini: number;
  /** Articoli di costo già creati da questo modello. */
  costi: CostoModello[];
}

const FASCE = FASCE_MODELLO.map((f) => ({ value: f, label: f }));

type Bozza = { id?: string; codice: string; descrizione: string; categoria: string; fascia: string; note: string };
const VUOTA: Bozza = { codice: "", descrizione: "", categoria: "", fascia: "Adulto", note: "" };

/** Archivio dei cartamodelli: codici del modellista, raggruppati per categoria. */
export default function ModelliClient({ modelli }: { modelli: ModelloRiga[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statoCosto, setStatoCosto] = useState<"tutti" | "senza" | "con">("tutti");
  const conCosto = modelli.filter((m) => m.costi.length > 0).length;
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const categorieEsistenti = ordinaCategorie(modelli.map((m) => m.categoria));
  const categorieScelta = ordinaCategorie([...CATEGORIE.filter((c) => c !== "Altro"), ...categorieEsistenti]);

  const filtro = q.trim().toLowerCase();
  const visibili = modelli.filter((m) =>
    (!filtro || [m.codice, m.descrizione, m.categoria, m.fascia].some((v) => v.toLowerCase().includes(filtro))) &&
    (statoCosto === "tutti" || (statoCosto === "con") === (m.costi.length > 0)));
  const gruppi = ordinaCategorie(visibili.map((m) => m.categoria)).map((cat) => ({
    categoria: cat,
    modelli: visibili.filter((m) => m.categoria === cat).sort((a, b) => a.codice.localeCompare(b.codice, "it", { numeric: true })),
  }));

  const set = <K extends keyof Bozza>(k: K, v: Bozza[K]) => setBozza((b) => (b ? { ...b, [k]: v } : b));

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bozza) return;
    setSalvando(true);
    setErrore(null);
    const nuovo = !bozza.id;
    const res = await fetch(nuovo ? "/api/modelli" : `/api/modelli/${bozza.id}`, {
      method: nuovo ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuovo ? bozza : { descrizione: bozza.descrizione, categoria: bozza.categoria, fascia: bozza.fascia, note: bozza.note }),
    });
    const body = await res.json().catch(() => ({}));
    setSalvando(false);
    if (!res.ok) { setErrore(body.error || "Salvataggio non riuscito"); return; }
    setBozza(null);
    router.refresh();
  };

  const elimina = async (m: ModelloRiga) => {
    const uso = m.articoli + m.ordini;
    const avviso = uso > 0 ? `\n\n${uso} schede usano questo modello: conservano il codice ${m.codice}, ma il modello sparisce dall'archivio.` : "";
    if (!confirm(`Eliminare il modello ${m.codice} – ${m.descrizione}?${avviso}`)) return;
    await fetch(`/api/modelli/${m.id}`, { method: "DELETE" });
    router.refresh();
  };

  const nuovaScheda = (m: ModelloRiga, tipo: "costo" | "produzione") =>
    `/schede/nuova?${new URLSearchParams({ modello: m.codice, tipo }).toString()}`;

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">Modelli</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            {modelli.length} cartamodelli del modellista · {categorieEsistenti.length} categorie ·{" "}
            <span className="font-semibold text-[#1D6B4A]">{conCosto} di {modelli.length} con il costo</span>
          </p>
        </div>
        <label className="w-full sm:w-72 h-12 border border-[#D6D1C4] rounded-xl bg-white flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
          <Search size={18} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca codice o modello" aria-label="Cerca modelli"
            className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-[15px]" />
        </label>
        <button type="button" onClick={() => { setErrore(null); setBozza({ ...VUOTA }); }}
          className="h-12 px-5 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2">
          <Plus size={18} /> Nuovo modello
        </button>
      </div>

      <div role="group" aria-label="Costo articolo" className="flex flex-wrap items-center gap-2">
        {([["tutti", "Tutti", modelli.length], ["senza", "Senza costo", modelli.length - conCosto], ["con", "Con costo", conCosto]] as const).map(([v, l, n]) => (
          <button key={v} type="button" aria-pressed={statoCosto === v} onClick={() => setStatoCosto(v)}
            className={`h-10 px-4 rounded-full border text-sm inline-flex items-center gap-1.5 ${statoCosto === v ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
            {l} <span className={`text-xs ${statoCosto === v ? "text-white/70" : "text-[#5F6878]"}`}>{n}</span>
          </button>
        ))}
      </div>

      {gruppi.length === 0 && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-14 text-[#5F6878]">
          {modelli.length === 0 ? "Nessun modello in archivio." : "Nessun modello con questa ricerca."}
        </div>
      )}

      {gruppi.map((g) => (
        <section key={g.categoria} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">{g.categoria}</h2>
            <span className="text-xs text-[#5F6878]">{g.modelli.length} {g.modelli.length === 1 ? "modello" : "modelli"}</span>
          </div>
          <ul>
            {g.modelli.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 border-b border-[#EFEBE2] last:border-0">
                <span className="font-mono text-sm font-semibold text-[#0E1B2C] w-28 flex-shrink-0">{m.codice}</span>
                <span className="flex-1 min-w-[160px]">
                  <span className="text-[15px] text-[#0E1B2C]">{m.descrizione}</span>
                  {m.note && <span className="block text-xs text-[#5F6878]">{m.note}</span>}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${FASCIA_STYLE[m.fascia] ?? "bg-[#EEEBE3] text-[#4A5566]"}`}>{m.fascia}</span>
                <span className="text-xs text-[#5F6878] w-36 text-right">
                  {m.articoli + m.ordini === 0 ? "Mai usato" : [
                    m.articoli > 0 && `${m.articoli} ${m.articoli === 1 ? "articolo" : "articoli"}`,
                    m.ordini > 0 && `${m.ordini} ${m.ordini === 1 ? "ordine" : "ordini"}`,
                  ].filter(Boolean).join(" · ")}
                </span>
                <span className="flex items-center gap-1.5 ml-auto">
                  {/* Il costo esiste già: si apre quello invece di crearne un doppione. */}
                  {m.costi.length === 1 ? (
                    <Link href={`/articoli/${m.costi[0].id}`} aria-label={`Apri il costo di ${m.codice}`}
                      className="h-10 w-[188px] justify-center px-3 rounded-lg border border-[#B9D8C6] bg-[#EAF5EE] text-[13px] font-semibold text-[#1D6B4A] inline-flex items-center gap-1.5 hover:border-[#1D6B4A]/50">
                      <Check size={15} /> Apri costo{m.costi[0].totale > 0 && <span className="font-mono"> · {formatEuro(m.costi[0].totale)}</span>}
                    </Link>
                  ) : m.costi.length > 1 ? (
                    <Link href={`/articoli?q=${encodeURIComponent(m.codice)}`} aria-label={`Apri i costi di ${m.codice}`}
                      className="h-10 w-[188px] justify-center px-3 rounded-lg border border-[#B9D8C6] bg-[#EAF5EE] text-[13px] font-semibold text-[#1D6B4A] inline-flex items-center gap-1.5 hover:border-[#1D6B4A]/50">
                      <Check size={15} /> {m.costi.length} costi
                    </Link>
                  ) : (
                    <Link href={nuovaScheda(m, "costo")} aria-label={`Nuovo articolo di costo da ${m.codice}`}
                      className="h-10 w-[188px] justify-center px-3 rounded-lg border border-[#D6D1C4] text-[13px] font-medium text-[#0E1B2C] inline-flex items-center gap-1.5 hover:border-[#0E1B2C]/40">
                      <Calculator size={15} /> + Costo articolo
                    </Link>
                  )}
                  <Link href={nuovaScheda(m, "produzione")} aria-label={`Nuovo ordine da ${m.codice}`}
                    className="h-10 px-3 rounded-lg border border-[#D6D1C4] text-[13px] font-medium text-[#0E1B2C] inline-flex items-center gap-1.5 hover:border-[#0E1B2C]/40">
                    <FileText size={15} /> Ordine
                  </Link>
                  <button type="button" aria-label={`Modifica ${m.codice}`}
                    onClick={() => { setErrore(null); setBozza({ id: m.id, codice: m.codice, descrizione: m.descrizione, categoria: m.categoria, fascia: m.fascia, note: m.note ?? "" }); }}
                    className="w-10 h-10 rounded-lg text-[#5F6878] hover:text-[#0E1B2C] hover:bg-[#0E1B2C]/5 inline-flex items-center justify-center">
                    <Pencil size={16} />
                  </button>
                  <button type="button" aria-label={`Elimina ${m.codice}`} onClick={() => elimina(m)}
                    className="w-10 h-10 rounded-lg text-[#5F6878] hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center">
                    <Trash2 size={16} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {bozza && (
        <div className="fixed inset-0 z-50 bg-[#0E1B2C]/50 flex items-center justify-center p-4" onClick={() => setBozza(null)}>
          <form role="dialog" aria-labelledby="titolo-modello" onSubmit={salva} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h2 id="titolo-modello" className="font-display text-2xl font-bold text-[#0E1B2C]">
                {bozza.id ? `Modifica ${bozza.codice}` : "Nuovo modello"}
              </h2>
              <button type="button" onClick={() => setBozza(null)} aria-label="Chiudi"
                className="w-10 h-10 rounded-full bg-[#F1EEE7] text-[#0E1B2C] flex items-center justify-center"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-3">
              <Field label="Codice modellista" hint={bozza.id ? "Non modificabile" : "Esattamente come dal modellista"}>
                <input type="text" required value={bozza.codice} onChange={(e) => set("codice", e.target.value)} disabled={!!bozza.id}
                  autoFocus={!bozza.id} placeholder="es. DUSP 218" className={`${inputCls} font-mono disabled:bg-[#F6F4EF] disabled:text-[#4A5566]`} />
              </Field>
              <Field label="Descrizione">
                <input type="text" required value={bozza.descrizione} onChange={(e) => set("descrizione", e.target.value)}
                  autoFocus={!!bozza.id} placeholder="es. Jacket bomber" className={inputCls} />
              </Field>
            </div>

            <ChipGroup label="Categoria" options={categorieScelta} value={bozza.categoria} onChange={(v) => set("categoria", v)} />
            <Field label="…oppure nuova categoria">
              <input type="text" value={categorieScelta.includes(bozza.categoria) ? "" : bozza.categoria}
                onChange={(e) => set("categoria", e.target.value)} placeholder="es. Gilet" className={inputCls} />
            </Field>

            <Segmented label="Fascia" options={FASCE} value={bozza.fascia} onChange={(v) => set("fascia", v)} />

            <Field label="Note (facoltative)">
              <input type="text" value={bozza.note} onChange={(e) => set("note", e.target.value)} placeholder="es. revisione aprile 2026" className={inputCls} />
            </Field>

            {errore && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{errore}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFEBE2]">
              <button type="button" onClick={() => setBozza(null)} className="h-12 px-5 rounded-xl text-[15px] font-medium text-[#0E1B2C] hover:bg-[#0E1B2C]/5">Annulla</button>
              <button type="submit" disabled={salvando || !bozza.codice.trim() || !bozza.descrizione.trim() || !bozza.categoria.trim()}
                className="h-12 px-6 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold disabled:opacity-50">
                {salvando ? "Salvataggio…" : bozza.id ? "Salva modifiche" : "Aggiungi modello"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
