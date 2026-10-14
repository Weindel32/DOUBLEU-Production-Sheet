export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import PulsantePdf from "@/components/ui/PulsantePdf";
import { acquistiOrdine } from "@/lib/approvvigionamentoServer";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import { SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";

const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
const num2 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 });

/** Approvvigionamento di un ordine: quanto materiale comprare, per fornitore, sommando tutte le sue schede. */
export default async function AcquistiOrdinePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const ordineId = decodeURIComponent(id);
  const prezzi = (await searchParams).prezzi !== "0";
  const { ordine, cliente, nSchede, riepilogo } = await acquistiOrdine(ordineId);
  const base = `/schede/ordine/${encodeURIComponent(ordineId)}`;
  const pdf = `/api/approvvigionamento/${encodeURIComponent(ordineId)}?prezzi=${prezzi ? 1 : 0}`;
  const senzaPeso = riepilogo.fornitori.flatMap((g) => g.righe).filter((r) => !r.acquisto);
  const stimate = riepilogo.referenze.filter((d) => d.stimati);
  const cella = "px-3 py-2.5";

  const chip = (label: string, href: string, attivo: boolean) => (
    <Link href={href} aria-current={attivo ? "true" : undefined}
      className={`h-10 px-4 rounded-full border text-sm inline-flex items-center whitespace-nowrap ${attivo ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
      {label}
    </Link>
  );

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-6xl">
      <Link href={`/schede?q=${encodeURIComponent(ordineId)}`} className="inline-flex items-center gap-2 h-11 text-sm text-[#4A5566] hover:text-[#0E1B2C]">
        <ArrowLeft size={16} /> Schede produzione
      </Link>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <div className="text-sm text-[#5F6878]">Approvvigionamento</div>
          <h1 className="font-display text-[30px] font-extrabold tracking-tight text-[#1F3A68] leading-tight">{cliente ?? "Ordine"}</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            <span className="font-mono text-[#0E1B2C]">{ordineId}</span>
            {ordine?.data && <> · {ordine.data}</>}
            {ordine?.stato && <> · {statoOrdine(ordine.stato)}</>}
            {` · ${nSchede} ${nSchede === 1 ? "scheda" : "schede"} · nel totale tessuti +${SCARTO_ACQUISTO * 100}% di scarto`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chip("Con prezzi", base, prezzi)}
          {chip("Senza prezzi", `${base}?prezzi=0`, !prezzi)}
        </div>
        <PulsantePdf key={pdf} url={pdf} nomeFile={`${prezzi ? "Approvvigionamento" : "Richiesta materiali"} ${ordineId}.pdf`}
          etichetta={`PDF ${prezzi ? "interno" : "fornitori"}`} className="w-full sm:w-auto" />
      </div>

      {stimate.length > 0 && (
        <div className="rounded-xl border border-[#C9D5E8] bg-[#EEF2F8] px-4 py-3 text-sm text-[#1F3A68]">
          <span className="font-semibold">Conto provvisorio:</span> {stimate.map((d) => d.nomeArticolo).join(", ")}{" "}
          {stimate.length === 1 ? "usa" : "usano"} i capi dell&apos;ordine perché le taglie non sono ancora arrivate.
        </div>
      )}

      {(riepilogo.escluse.length > 0 || senzaPeso.length > 0) && (
        <div role="alert" className="rounded-xl border border-[#E8C98A] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5B12] space-y-1">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Non tutto è nel conto</div>
          {riepilogo.escluse.map((s) => (
            <div key={s.id}>
              <Link href={`/schede/${s.id}`} className="font-semibold underline underline-offset-2">{s.codice} {s.nomeArticolo}</Link>: {s.motivo}
            </div>
          ))}
          {senzaPeso.map((r) => (
            <div key={`${r.materiale.id}${r.colore}`}>
              <Link href={`/materiali/${r.materiale.id}/modifica`} className="font-semibold underline underline-offset-2">{r.materiale.nome}</Link>: servono peso e altezza per passare da metri a kg ({num1(r.quantitaNetta)} m netti)
            </div>
          ))}
        </div>
      )}

      {riepilogo.fornitori.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-16 px-6 text-sm text-[#5F6878]">
          {nSchede === 0 ? "Nessuna scheda collegata a questo ordine." : "Inserisci quantità per taglia e consumo dei materiali nelle schede per vedere cosa comprare."}
        </div>
      ) : (
        <>
          <h2 className="font-display text-xl font-bold text-[#0E1B2C] pt-1">Dettaglio per referenza</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {riepilogo.referenze.map((d) => (
              <section key={d.id} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#E4E0D6] bg-[#FBFAF7] flex items-baseline justify-between gap-3">
                  <Link href={`/schede/${d.id}`} className="font-semibold text-[#0E1B2C] hover:text-[#1F3A68] hover:underline underline-offset-2 truncate">{d.nomeArticolo}</Link>
                  <span className="text-[13px] text-[#5F6878] whitespace-nowrap"><span className="font-mono">{d.codice}</span> · {d.capi} capi{d.stimati && <span className="text-[#7A5B12]"> stimati</span>}</span>
                </div>
                <ul className="divide-y divide-[#EFEBE2]">
                  {d.righe.map((r, i) => (
                    <li key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#0E1B2C]">{r.materiale.nome}</div>
                        <div className="text-[13px] text-[#5F6878]">
                          {r.coloreEtichetta ?? <span className="text-[#A8461F]">colore da definire</span>}
                          {` · ${num2(r.consumoPerCapo)} ${r.netto?.unita === "pz" ? "pz" : "m"}/capo`}
                        </div>
                      </div>
                      <div className="text-right font-mono whitespace-nowrap">
                        <div className="text-[#0E1B2C]">
                          {!r.netto ? `${num1(r.quantita)} m` : r.netto.unita === "kg" ? `${num1(r.netto.metri!)} m = ${num1(r.netto.netto)} kg` : `${num1(r.netto.netto)} ${r.netto.unita}`}
                        </div>
                        {prezzi && r.netto?.costo != null && <div className="text-[13px] text-[#5F6878]">{formatEuro(r.netto.costo)}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="pt-3">
            <h2 className="font-display text-xl font-bold text-[#0E1B2C]">Totale da acquistare</h2>
            <p className="text-sm text-[#5F6878]">Stesso materiale e colore sommati su tutto l&apos;ordine, con lo scarto e arrotondati per eccesso: è quello che si ordina.</p>
          </div>
          {riepilogo.fornitori.map((g) => (
            <section key={g.fornitore || "nessuno"} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[17px] font-bold text-[#0E1B2C] flex-1">{g.fornitore || "Fornitore non indicato"}</h2>
                {prezzi && <span className="font-mono text-[15px] font-semibold text-[#0E1B2C]">{formatEuro(g.stima)}</span>}
                <PulsantePdf url={`/api/approvvigionamento/${encodeURIComponent(ordineId)}?prezzi=0&fornitore=${encodeURIComponent(g.fornitore)}`}
                  nomeFile={`Richiesta materiali ${ordineId} ${g.fornitore || "fornitore"}.pdf`} etichetta={`PDF per ${g.fornitore || "fornitore"}`} variante="bordo" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] min-w-[640px] table-fixed">
                  <colgroup><col /><col className="w-[30%]" /><col className="w-[170px]" /><col className="w-[120px]" />{prezzi && <col className="w-[120px]" />}</colgroup>
                  <thead>
                    <tr className="border-b border-[#E4E0D6] text-left text-[13px] text-[#5F6878]">
                      <th className={`${cella} font-medium`}>Materiale</th>
                      <th className={`${cella} font-medium`}>Colore</th>
                      <th className={`${cella} font-medium text-right`}>Netto</th>
                      <th className={`${cella} font-medium text-right`}>Da comprare</th>
                      {prezzi && <th className={`${cella} font-medium text-right`}>Stima</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {g.righe.map((r) => {
                      const a = r.acquisto;
                      return (
                        <tr key={`${r.materiale.id}${r.codiceColore}${r.colore}`} className="border-b border-[#EFEBE2] last:border-0 align-top">
                          <td className={cella}>
                            <div className="font-semibold text-[#0E1B2C]">{r.materiale.nome}</div>
                            {r.materiale.codice && <div className="text-xs font-mono text-[#5F6878]">art. {r.materiale.codice}</div>}
                          </td>
                          <td className={cella}>{r.coloreEtichetta ?? <span className="text-[#A8461F] text-sm">da definire</span>}</td>
                          <td className={`${cella} text-right font-mono text-sm text-[#4A5566] whitespace-nowrap`}>
                            {a?.unita === "kg" ? `${num1(a.metri!)} m = ${num1(a.netto)} kg` : a?.unita === "pz" ? `${num1(r.quantitaNetta)} pz` : `${num1(r.quantitaNetta)} m`}
                          </td>
                          <td className={`${cella} text-right font-mono font-semibold text-[#0E1B2C] whitespace-nowrap`}>{a ? quantitaAcquisto(a) : "—"}</td>
                          {prezzi && (
                            <td className={`${cella} text-right font-mono whitespace-nowrap`}>
                              {a?.stima != null ? formatEuro(a.stima) : <span className="text-[#A8461F] text-sm font-sans">manca il prezzo</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          {prezzi && (
            <div className="flex flex-wrap items-baseline justify-end gap-x-3 text-[15px]">
              <span className="text-[#4A5566]">
                Totale acquisti stimato
                {riepilogo.senzaPrezzo > 0 && <span className="text-xs text-[#A8461F]"> · {riepilogo.senzaPrezzo} senza prezzo, esclus{riepilogo.senzaPrezzo === 1 ? "o" : "i"}</span>}
              </span>
              <strong className="font-mono text-xl text-[#0E1B2C]">{formatEuro(riepilogo.totale)}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}
