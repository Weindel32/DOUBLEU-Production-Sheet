"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Receipt } from "lucide-react";
import { numStr } from "@/components/ui/Form";
import { formatEuro } from "@/lib/utils";
import type { FaseSpesa } from "@/lib/consuntivo";
import type { ArticoloConto } from "@/lib/consuntivoServer";

/** Lavorazioni pagate a terzi (fasonista, tagliatore, stampa, ricamo): si registrano come spesa da qui. */
const LAVORAZIONI: FaseSpesa[] = ["Taglio", "Confezione", "Stampa", "Ricamo"];
/** Materiali: si comprano per l'ordine intero, qui solo per sapere quanto valgono gli articoli scelti. */
const MATERIALI: FaseSpesa[] = ["Tessuto", "Accessori"];

const oggi = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const leggiPezzi = (v: string) => {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Conto di alcuni articoli dell'ordine: pezzi consegnati (modificabili) × costo per capo, fase per fase.
 * È il previsto delle schede: lo speso reale resta sull'ordine, nel consuntivo, dove si registra da qui.
 */
export default function ContoSelezione({ ordineId, articoli, consuntivoHref, mobile = false }: {
  ordineId: string;
  articoli: ArticoloConto[];
  consuntivoHref: string;
  mobile?: boolean;
}) {
  const [pezzi, setPezzi] = useState<Record<string, string>>(() =>
    Object.fromEntries(articoli.map((a) => [a.id, a.esclusa ? "0" : String(a.capi || 0)])));
  const pz = (id: string) => leggiPezzi(pezzi[id] ?? "0");
  const conPezzi = articoli.filter((a) => pz(a.id) > 0);
  const totPezzi = conPezzi.reduce((t, a) => t + pz(a.id), 0);

  // Taglio e confezione li ha ogni capo: un costo a zero è un dato mancante. Stampa, ricamo e materiali
  // no: un articolo senza stampa semplicemente non compare in quella fase.
  const fase = (f: FaseSpesa) => {
    const obbligatoria = f === "Taglio" || f === "Confezione";
    const righe = conPezzi
      .map((a) => ({ a, n: pz(a.id), perCapo: a.perCapo[f], importo: pz(a.id) * a.perCapo[f] }))
      .filter((r) => obbligatoria || r.perCapo > 0);
    return { fase: f, righe, totale: righe.reduce((t, r) => t + r.importo, 0), senzaCosto: righe.filter((r) => !(r.perCapo > 0)) };
  };
  // Taglio e confezione sempre (se mancano i costi si deve vedere), stampa e ricamo solo se usati.
  const lavorazioni = LAVORAZIONI.map(fase).filter((x) => x.fase === "Taglio" || x.fase === "Confezione" || x.totale > 0);
  const materiali = MATERIALI.map(fase).filter((x) => x.totale > 0);
  const totaleLavorazioni = lavorazioni.reduce((t, x) => t + x.totale, 0);

  const card = "bg-white border border-[#E4E0D6] rounded-2xl";
  const inputPz = `w-[84px] ${mobile ? "h-12 text-[17px]" : "h-10 text-[15px]"} border border-[#D6D1C4] rounded-lg px-2 text-right font-mono bg-white focus:border-[#1F3A68] outline-none`;

  return (
    <div className="space-y-4">
      <section className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">Articoli e pezzi consegnati</h2>
          <span className="text-[13px] text-[#5F6878] whitespace-nowrap">{totPezzi} pz</span>
        </div>
        <ul className="divide-y divide-[#EFEBE2]">
          {articoli.map((a) => (
            <li key={a.id} className="px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#0E1B2C] truncate">{a.nomeArticolo}</div>
                <div className="text-[13px] text-[#5F6878] truncate">
                  <span className="font-mono">{a.codiceModello || a.codice}</span>
                  {a.produttore && <> · {a.produttore}</>}
                  {a.esclusa ? <span className="text-[#A8461F]"> · {a.esclusa}</span>
                    : <> · ordine {a.capi} pz{a.stimati ? " (stima)" : ""}</>}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-[13px] text-[#5F6878] flex-shrink-0">
                <span className="sr-only">Pezzi consegnati di {a.nomeArticolo}</span>
                <input type="text" inputMode="numeric" value={pezzi[a.id] ?? ""} className={inputPz}
                  onChange={(e) => setPezzi((p) => ({ ...p, [a.id]: e.target.value }))}
                  onFocus={(e) => e.target.select()} />
                pz
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className={`${card} px-4 py-3 flex items-baseline justify-between gap-3`}>
        <div>
          <div className="text-[13px] text-[#5F6878]">Lavorazioni da pagare</div>
          <div className="text-xs text-[#5F6878]">{conPezzi.length} {conPezzi.length === 1 ? "articolo" : "articoli"} · {totPezzi} pz</div>
        </div>
        <div className="font-display text-[26px] font-bold text-[#0E1B2C]">{formatEuro(totaleLavorazioni)}</div>
      </div>

      {lavorazioni.map((x) => (
        <FaseConto key={x.fase} ordineId={ordineId} {...x} card={card} mobile={mobile} consuntivoHref={consuntivoHref} />
      ))}

      {materiali.length > 0 && (
        <section className={`${card} px-4 py-3 space-y-1.5 text-sm`}>
          <h2 className="font-display text-[15px] font-bold text-[#4A5566]">Materiali di questi articoli</h2>
          <p className="text-[13px] text-[#5F6878]">Non si pagano al fasonista: si comprano per tutto l&apos;ordine e si registrano dagli acquisti.</p>
          {materiali.map((x) => (
            <div key={x.fase} className="flex justify-between gap-3">
              <span className="text-[#4A5566]">{x.fase}</span>
              <span className="font-mono text-[#4A5566]">{formatEuro(x.totale)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/** Una lavorazione: dettaglio articolo per articolo e registrazione della spesa nel consuntivo dell'ordine. */
function FaseConto({ ordineId, fase, righe, totale, senzaCosto, card, mobile, consuntivoHref }: {
  ordineId: string;
  fase: FaseSpesa;
  righe: { a: ArticoloConto; n: number; perCapo: number; importo: number }[];
  totale: number;
  senzaCosto: { a: ArticoloConto }[];
  card: string;
  mobile: boolean;
  consuntivoHref: string;
}) {
  const router = useRouter();
  const produttori = [...new Set(righe.map((r) => r.a.produttore?.trim()).filter(Boolean))] as string[];
  const descrizione = righe.map((r) => `${r.a.nomeArticolo} ${r.n} pz`).join(", ");
  const [aperta, setAperta] = useState(false);
  const [fornitore, setFornitore] = useState("");
  const [importo, setImporto] = useState("");
  const [fattura, setFattura] = useState(false);
  const [stato, setStato] = useState<"libero" | "salvo" | "fatto">("libero");
  const [errore, setErrore] = useState<string | null>(null);

  const apri = () => {
    // Il fasonista della scheda vale per la confezione (e di solito per il taglio): se sono più d'uno si sceglie.
    setFornitore(produttori.length === 1 ? produttori[0] : "");
    setImporto(numStr(Math.round(totale * 100) / 100));
    setErrore(null);
    setStato("libero");
    setAperta(true);
  };

  const registra = async () => {
    setStato("salvo");
    setErrore(null);
    const res = await fetch(`/api/ordini/${encodeURIComponent(ordineId)}/spese`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: oggi(), fase, fornitore, descrizione, importo, fattura, iva: fattura ? "22" : "" }),
    }).catch(() => null);
    if (!res?.ok) {
      setErrore((await res?.json().catch(() => ({})))?.error || "Spesa non registrata: riprova.");
      setStato("libero");
      return;
    }
    setStato("fatto");
    setAperta(false);
    router.refresh();
  };

  const campo = `${mobile ? "h-12 text-[16px]" : "h-10 text-sm"} w-full border border-[#D6D1C4] rounded-lg px-3 bg-white focus:border-[#1F3A68] outline-none`;

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[#EFEBE2]">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">{fase}</h2>
          {produttori.length > 0 && (fase === "Confezione" || fase === "Taglio") && (
            <div className="text-[13px] text-[#5F6878] truncate">{produttori.join(" · ")}</div>
          )}
        </div>
        <div className="font-display text-[20px] font-bold text-[#0E1B2C] whitespace-nowrap">{formatEuro(totale)}</div>
      </div>

      {righe.length > 0 && (
        <ul className="px-4 py-2 space-y-1 text-[14px]">
          {righe.map((r) => (
            <li key={r.a.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[#4A5566]">{r.a.nomeArticolo}</span>
              <span className={`font-mono whitespace-nowrap ${r.perCapo > 0 ? "text-[#0E1B2C]" : "text-[#A8461F]"}`}>
                {r.n} × {r.perCapo > 0 ? formatEuro(r.perCapo) : "—"} = {formatEuro(r.importo)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {senzaCosto.length > 0 && (
        <div className="mx-4 mb-2 rounded-lg bg-[#FBF3DF] border border-[#E8C98A] px-3 py-2 text-[13px] text-[#7A5B12] flex gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>Costo {fase.toLowerCase()} non inserito in {senzaCosto.map((x) => x.a.nomeArticolo).join(", ")}: il totale è incompleto.</span>
        </div>
      )}

      <div className="px-4 py-3 border-t border-[#EFEBE2] bg-[#FBFAF7]">
        {stato === "fatto" && !aperta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#1D6B4A]">
            <span className="inline-flex items-center gap-1.5 font-semibold"><Check size={16} /> Registrata nel consuntivo</span>
            <Link href={consuntivoHref} className="text-[#1F3A68] underline underline-offset-2">Apri consuntivo</Link>
          </div>
        )}
        {aperta ? (
          <div className="space-y-2.5">
            <div className={`grid gap-2.5 ${mobile ? "" : "sm:grid-cols-3"}`}>
              <label className="text-[13px] text-[#4A5566] space-y-1">
                <span>Pagato a</span>
                {produttori.length > 1 ? (
                  <select value={fornitore} onChange={(e) => setFornitore(e.target.value)} className={campo}>
                    <option value="">Scegli…</option>
                    {produttori.map((p) => <option key={p}>{p}</option>)}
                  </select>
                ) : (
                  <input value={fornitore} onChange={(e) => setFornitore(e.target.value)} placeholder="es. Laboratorio Rossi" className={campo} />
                )}
              </label>
              <label className="text-[13px] text-[#4A5566] space-y-1">
                <span>{fattura ? "Imponibile (IVA esclusa)" : "Importo pagato"}</span>
                <input type="text" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} className={`${campo} text-right font-mono`} />
              </label>
              <div className="text-[13px] text-[#4A5566] space-y-1">
                <span className="block">Documento</span>
                <div className="flex bg-[#EEEBE3] rounded-lg p-1">
                  {[{ v: false, l: "Senza fattura" }, { v: true, l: "Con fattura" }].map((o) => (
                    <button key={o.l} type="button" onClick={() => setFattura(o.v)} aria-pressed={fattura === o.v}
                      className={`flex-1 ${mobile ? "h-10" : "h-8"} rounded-md text-[13px] ${fattura === o.v ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#5F6878]">Data di oggi · {descrizione}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={registra} disabled={stato === "salvo"}
                className={`${mobile ? "h-12 flex-1" : "h-10"} px-4 rounded-lg bg-[#0E1B2C] text-white text-sm font-semibold hover:bg-[#1F3A68] disabled:opacity-50`}>
                {stato === "salvo" ? "Registro…" : "Registra spesa"}
              </button>
              <button type="button" onClick={() => setAperta(false)} className={`${mobile ? "h-12" : "h-10"} px-3 text-sm text-[#4A5566]`}>Annulla</button>
              {errore && <span role="alert" className="text-sm text-red-700">{errore}</span>}
            </div>
          </div>
        ) : (
          stato !== "fatto" && (
            <button type="button" onClick={apri} disabled={!(totale > 0)}
              className={`${mobile ? "h-12 w-full justify-center" : "h-10"} px-3.5 rounded-lg border border-[#D6D1C4] bg-white text-[13px] font-semibold text-[#0E1B2C] inline-flex items-center gap-1.5 hover:border-[#0E1B2C]/40 disabled:opacity-40`}>
              <Receipt size={15} /> Registra come spesa {fase.toLowerCase()}
            </button>
          )
        )}
      </div>
    </section>
  );
}
