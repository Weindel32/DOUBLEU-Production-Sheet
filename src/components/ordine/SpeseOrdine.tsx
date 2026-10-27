"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Lock, LockOpen } from "lucide-react";
import { Field, Segmented, inputCls, numStr } from "@/components/ui/Form";
import { FASI_SPESA, type Spesa } from "@/lib/consuntivo";
import { formatEuro } from "@/lib/utils";

const oggi = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const inItaliano = (s: string) => s.split("-").reverse().join("/");

type Bozza = { data: string; fase: string; fornitore: string; descrizione: string; importo: string; fattura: boolean; iva: string; riferimento: string };

const vuota = (): Bozza => ({ data: oggi(), fase: "Tessuto", fornitore: "", descrizione: "", importo: "", fattura: true, iva: "22", riferimento: "" });
const daSpesa = (s: Spesa): Bozza => ({
  data: s.data, fase: s.fase, fornitore: s.fornitore ?? "", descrizione: s.descrizione ?? "", importo: numStr(s.importo),
  fattura: s.fattura, iva: numStr(s.iva), riferimento: s.riferimento ?? "",
});

/** Elenco e inserimento delle spese reali di un ordine, più chiusura del consuntivo. */
export default function SpeseOrdine({ ordineId, spese, chiusoIl }: { ordineId: string; spese: Spesa[]; chiusoIl: string | null }) {
  const router = useRouter();
  // null = form chiuso, "nuova" = inserimento, altrimenti id della spesa in modifica
  const [aperta, setAperta] = useState<string | null>(null);
  const [bozza, setBozza] = useState<Bozza>(vuota);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const base = `/api/ordini/${encodeURIComponent(ordineId)}`;
  const set = <K extends keyof Bozza>(k: K, v: Bozza[K]) => setBozza((b) => ({ ...b, [k]: v }));

  const apri = (id: string | null, b: Bozza) => { setAperta(id); setBozza(b); setErrore(null); };

  const chiama = async (url: string, method: string, body?: unknown) => {
    setSalvando(true);
    setErrore(null);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setSalvando(false);
    if (!res.ok) { setErrore((await res.json().catch(() => ({}))).error || "Operazione non riuscita"); return false; }
    router.refresh();
    return true;
  };

  const salva = async () => {
    const ok = aperta === "nuova"
      ? await chiama(`${base}/spese`, "POST", bozza)
      : await chiama(`${base}/spese/${aperta}`, "PUT", bozza);
    if (ok) setAperta(null);
  };

  const elimina = async (s: Spesa) => {
    if (!confirm(`Eliminare la spesa di ${formatEuro(s.importo)} (${s.fase})?`)) return;
    if (await chiama(`${base}/spese/${s.id}`, "DELETE")) setAperta(null);
  };

  const form = (
    <div className="bg-[#FBFAF7] border border-[#E4E0D6] rounded-2xl p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Data">
          <input type="date" value={bozza.data} onChange={(e) => set("data", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Fase">
          <select value={bozza.fase} onChange={(e) => set("fase", e.target.value)} className={inputCls}>
            {FASI_SPESA.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Fornitore">
          <input value={bozza.fornitore} onChange={(e) => set("fornitore", e.target.value)} className={inputCls} placeholder="es. CTA" />
        </Field>
        <Field label="Descrizione">
          <input value={bozza.descrizione} onChange={(e) => set("descrizione", e.target.value)} className={inputCls} placeholder="es. Jersey navy 62 m" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <Segmented label="Documento" value={bozza.fattura ? "si" : "no"} onChange={(v) => set("fattura", v === "si")}
          options={[{ value: "si", label: "Con fattura" }, { value: "no", label: "Senza fattura" }]} />
        <Field label={bozza.fattura ? "Imponibile (IVA esclusa)" : "Importo pagato"}>
          <input type="text" inputMode="decimal" value={bozza.importo} onChange={(e) => set("importo", e.target.value)}
            className={`${inputCls} text-right font-mono`} placeholder="0,00" />
        </Field>
        {bozza.fattura ? (
          <Field label="IVA % (riferimento)">
            <input type="text" inputMode="decimal" value={bozza.iva} onChange={(e) => set("iva", e.target.value)} className={`${inputCls} text-right font-mono`} />
          </Field>
        ) : <div className="text-xs text-[#5F6878] pb-2">Senza fattura conta tutto l&apos;importo pagato: non c&apos;è IVA da recuperare.</div>}
        <Field label="N° fattura / DDT">
          <input value={bozza.riferimento} onChange={(e) => set("riferimento", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={salva} disabled={salvando}
          className="h-11 px-5 rounded-[10px] bg-[#0E1B2C] text-white text-sm font-semibold hover:bg-[#1F3A68] disabled:opacity-50">
          {salvando ? "Salvo…" : aperta === "nuova" ? "Aggiungi spesa" : "Salva modifiche"}
        </button>
        <button type="button" onClick={() => setAperta(null)} className="h-11 px-4 rounded-[10px] text-sm text-[#4A5566] hover:text-[#0E1B2C]">Annulla</button>
        {errore && <span role="alert" className="text-sm text-red-700">{errore}</span>}
      </div>
    </div>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold text-[#0E1B2C] flex-1">Spese registrate</h2>
        <button type="button" onClick={() => chiama(`${base}/consuntivo`, "PUT", { chiuso: !chiusoIl })} disabled={salvando}
          className="h-10 px-3.5 rounded-lg border border-[#D6D1C4] text-[13px] font-semibold text-[#0E1B2C] inline-flex items-center gap-1.5 hover:border-[#0E1B2C]/40 disabled:opacity-50">
          {chiusoIl ? <><LockOpen size={15} /> Riapri consuntivo</> : <><Lock size={15} /> Chiudi consuntivo</>}
        </button>
        {aperta !== "nuova" && (
          <button type="button" onClick={() => apri("nuova", vuota())}
            className="h-10 px-3.5 rounded-lg bg-[#0E1B2C] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#1F3A68]">
            <Plus size={15} /> Nuova spesa
          </button>
        )}
      </div>
      {errore && aperta === null && <div role="alert" className="text-sm text-red-700">{errore}</div>}
      {aperta === "nuova" && form}

      {spese.length === 0 ? (
        aperta !== "nuova" && (
          <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-12 px-6 text-sm text-[#5F6878]">
            Nessuna spesa registrata. Aggiungi fatture e pagamenti di tessuto, taglio, confezione e le altre fasi man mano che arrivano.
          </div>
        )
      ) : (
        <ul className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#EFEBE2] overflow-hidden">
          {spese.map((s) => (
            <li key={s.id}>
              {aperta === s.id ? <div className="p-3">{form}</div> : (
                <div className="px-4 py-3 flex items-start gap-3 text-sm">
                  <div className="w-[86px] flex-shrink-0 font-mono text-[13px] text-[#5F6878] pt-0.5">{inItaliano(s.data)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0E1B2C]">
                      {s.fase}{s.fornitore && <span className="font-normal text-[#4A5566]"> · {s.fornitore}</span>}
                    </div>
                    <div className="text-[13px] text-[#5F6878]">
                      {[s.descrizione, s.riferimento && `rif. ${s.riferimento}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="font-mono font-semibold text-[#0E1B2C]">{formatEuro(s.importo)}</div>
                    <div className={`text-xs ${s.fattura ? "text-[#5F6878]" : "text-[#7A5B12]"}`}>
                      {s.fattura ? `imponibile${s.iva != null ? ` + IVA ${numStr(s.iva)}%` : ""}` : "senza fattura"}
                    </div>
                  </div>
                  <div className="flex -my-1">
                    <button type="button" onClick={() => apri(s.id, daSpesa(s))} aria-label="Modifica spesa"
                      className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-[#5F6878] hover:bg-[#F6F4EF] hover:text-[#0E1B2C]">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => elimina(s)} aria-label="Elimina spesa"
                      className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-[#5F6878] hover:bg-[#F6F4EF] hover:text-red-700">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
