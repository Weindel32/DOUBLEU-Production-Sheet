export const dynamic = "force-dynamic";
import Link from "next/link";
import { Printer, AlertTriangle, ChevronDown } from "lucide-react";
import Testata from "@/components/mobile/Testata";
import { acquistiOrdine } from "@/lib/approvvigionamentoServer";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import { SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";

const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

/**
 * Cosa comprare per un ordine, dal telefono (es. dal fornitore): quantità in grande, stime solo a richiesta.
 * Le stampe si aprono nella stessa finestra, con la barra per tornare qui o alla Home.
 */
export default async function AcquistiMobile({ params, searchParams }: {
  params: Promise<{ ordine: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const ordineId = decodeURIComponent((await params).ordine);
  const prezzi = (await searchParams).prezzi === "1";
  const { ordine, cliente, riepilogo } = await acquistiOrdine(ordineId);
  const qui = `/m/acquisti/${encodeURIComponent(ordineId)}`;
  const stampa = (conPrezzi: boolean) =>
    `/api/approvvigionamento/${encodeURIComponent(ordineId)}?prezzi=${conPrezzi ? 1 : 0}&da=m&torna=${encodeURIComponent(qui)}`;
  const stimate = riepilogo.referenze.filter((d) => d.stimati);
  const senzaPeso = riepilogo.fornitori.flatMap((g) => g.righe).filter((r) => !r.acquisto);

  return (
    <>
      <Testata indietro="/m/schede" sopra={`Da acquistare · ${ordineId}`} titolo={cliente ?? "Ordine"} />
      <div className="px-4 space-y-3 pb-6">
        <p className="text-[13px] text-[#5F6878] -mt-1">
          {ordine?.stato && `${statoOrdine(ordine.stato)} · `}tessuti +{SCARTO_ACQUISTO * 100}% di scarto, arrotondati per eccesso
        </p>

        <div role="group" aria-label="Stime" className="flex bg-[#EEEBE3] rounded-xl p-1">
          {[{ on: !prezzi, label: "Solo quantità", href: qui }, { on: prezzi, label: "Con stime €", href: `${qui}?prezzi=1` }].map((t) => (
            <Link key={t.label} href={t.href} aria-current={t.on ? "true" : undefined}
              className={`flex-1 h-11 rounded-lg flex items-center justify-center text-[15px] ${t.on ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
              {t.label}
            </Link>
          ))}
        </div>

        {stimate.length > 0 && (
          <p className="rounded-xl border border-[#C9D5E8] bg-[#EEF2F8] px-4 py-3 text-[14px] text-[#1F3A68]">
            <strong>Conto provvisorio:</strong> {stimate.map((d) => d.nomeArticolo).join(", ")} sui capi dell&apos;ordine, taglie non ancora arrivate.
          </p>
        )}
        {(riepilogo.escluse.length > 0 || senzaPeso.length > 0) && (
          <div className="rounded-xl border border-[#E8C98A] bg-[#FBF3DF] px-4 py-3 text-[14px] text-[#7A5B12] space-y-1">
            <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Non tutto è nel conto</div>
            {riepilogo.escluse.map((s) => <div key={s.id}>{s.nomeArticolo}: {s.motivo}</div>)}
            {senzaPeso.map((r) => <div key={`${r.materiale.id}${r.colore}`}>{r.materiale.nome}: mancano peso e altezza</div>)}
          </div>
        )}

        {riepilogo.fornitori.length === 0 ? (
          <p className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">
            Niente da acquistare: mancano quantità o consumi nelle schede dell&apos;ordine.
          </p>
        ) : (
          <>
            {riepilogo.fornitori.map((g) => (
              <section key={g.fornitore || "nessuno"} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#EFEBE2] flex items-baseline justify-between">
                  <h2 className="font-display font-bold text-[17px]">{g.fornitore || "Fornitore non indicato"}</h2>
                  {prezzi && <span className="font-mono font-semibold">{formatEuro(g.stima)}</span>}
                </div>
                <ul className="divide-y divide-[#EFEBE2]">
                  {g.righe.map((r) => (
                    <li key={`${r.materiale.id}${r.codiceColore}${r.colore}`} className="px-4 py-3 flex items-start gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold">{r.materiale.nome}</span>
                        {r.materiale.codice && <span className="block text-xs font-mono text-[#5F6878]">art. {r.materiale.codice}</span>}
                        <span className="block text-[14px] mt-0.5">{r.coloreEtichetta ?? <span className="text-[#A8461F]">colore da definire</span>}</span>
                      </span>
                      <span className="text-right flex-shrink-0">
                        <span className="block font-mono text-[22px] font-bold leading-tight">{r.acquisto ? quantitaAcquisto(r.acquisto) : "—"}</span>
                        {r.acquisto?.unita === "kg" && <span className="block text-xs text-[#5F6878]">{num1(r.acquisto.metri!)} m netti</span>}
                        {prezzi && <span className="block text-[13px] text-[#5F6878] font-mono">{r.acquisto?.stima != null ? formatEuro(r.acquisto.stima) : "manca il prezzo"}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {prezzi && (
              <div className="flex items-baseline justify-between px-1">
                <span className="text-[#4A5566]">Totale stimato</span>
                <strong className="font-mono text-xl">{formatEuro(riepilogo.totale)}</strong>
              </div>
            )}

            <details className="group bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
              <summary className="list-none [&::-webkit-details-marker]:hidden px-4 py-3.5 flex items-center justify-between font-display font-bold text-[16px]">
                Dettaglio per referenza
                <ChevronDown size={20} className="text-[#5F6878] transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-[#EFEBE2] divide-y divide-[#EFEBE2]">
                {riepilogo.referenze.map((d) => (
                  <div key={d.id} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/m/schede/${d.id}`} className="font-semibold text-[#1F3A68]">{d.nomeArticolo}</Link>
                      <span className="text-[13px] text-[#5F6878]">{d.capi} capi{d.stimati && " stimati"}</span>
                    </div>
                    {d.righe.map((r, i) => (
                      <div key={i} className="flex justify-between gap-3 text-[14px] mt-1">
                        <span className="min-w-0 truncate">{r.materiale.nome} <span className="text-[#5F6878]">· {r.coloreEtichetta ?? "da definire"}</span></span>
                        <span className="font-mono whitespace-nowrap">
                          {!r.netto ? `${num1(r.quantita)} m` : r.netto.unita === "kg" ? `${num1(r.netto.netto)} kg` : `${num1(r.netto.netto)} ${r.netto.unita}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>

            <div className="grid gap-2 pt-1">
              <a href={stampa(false)} className="h-12 rounded-xl bg-[#0E1B2C] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#1F3A68]">
                <Printer size={18} /> Stampa / invia ai fornitori
              </a>
              <a href={stampa(true)} className="h-12 rounded-xl border border-[#D6D1C4] bg-white text-[#0E1B2C] text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#FBFAF7]">
                <Printer size={18} /> Stampa interna (con stime)
              </a>
              <p className="text-center text-xs text-[#5F6878]">Si apre la versione per stampa: in alto Indietro e Home per tornare qui.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
