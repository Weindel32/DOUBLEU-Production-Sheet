export const dynamic = "force-dynamic";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import SpeseOrdine from "@/components/ordine/SpeseOrdine";
import SpuntaFase from "@/components/ordine/SpuntaFase";
import { consuntivoOrdine } from "@/lib/consuntivoServer";
import { coloreMargine, formatData, formatEuro, statoOrdine } from "@/lib/utils";

const pct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`);
const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
const segno = (n: number, f: (n: number) => string) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${f(Math.abs(n))}`;

/** Consuntivo di un ordine: spese reali per fase contro il costo previsto dalle schede, e margine reale. */
export default async function ConsuntivoOrdinePage({ params }: { params: Promise<{ id: string }> }) {
  const ordineId = decodeURIComponent((await params).id);
  const { ordine, cliente, nSchede, capiStimati, spese, chiusoIl, riepilogo: r, tessuto, vendita, margini, fasiAttive } = await consuntivoOrdine(ordineId);
  const conIva = (prezzo: number) => (vendita && vendita.iva > 0 ? prezzo * (1 + vendita.iva / 100) : null);
  const senzaScheda = margini.reduce((t, m) => t + m.senzaScheda, 0);
  const scontiDaVerificare = margini.filter((m) => m.scontoDaVerificare).length;
  const aKit = vendita?.modo === "kit";
  const base = `/schede/ordine/${encodeURIComponent(ordineId)}`;
  const righe = r.righe.filter((x) => x.previsto > 0 || x.speso > 0);
  const cella = "px-3 py-2.5";

  const chip = (label: string, href: string, attivo: boolean) => (
    <Link href={href} aria-current={attivo ? "page" : undefined}
      className={`h-10 px-4 rounded-full border text-sm inline-flex items-center whitespace-nowrap ${attivo ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
      {label}
    </Link>
  );
  const tile = (label: string, valore: ReactNode, nota?: ReactNode) => (
    <div className="bg-white border border-[#E4E0D6] rounded-2xl px-4 py-3">
      <div className="text-[13px] text-[#5F6878]">{label}</div>
      <div className="font-display text-[22px] font-bold text-[#0E1B2C] leading-tight mt-0.5">{valore}</div>
      {nota && <div className="text-xs text-[#5F6878] mt-0.5">{nota}</div>}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-6xl">
      <Link href={`/schede?q=${encodeURIComponent(ordineId)}`} className="inline-flex items-center gap-2 h-11 text-sm text-[#4A5566] hover:text-[#0E1B2C]">
        <ArrowLeft size={16} /> Schede produzione
      </Link>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[260px]">
          <div className="text-sm text-[#5F6878]">Consuntivo</div>
          <h1 className="font-display text-[30px] font-extrabold tracking-tight text-[#1F3A68] leading-tight">{cliente ?? "Ordine"}</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            <span className="font-mono text-[#0E1B2C]">{ordineId}</span>
            {ordine?.data && <> · {ordine.data}</>}
            {ordine?.stato && <> · {statoOrdine(ordine.stato)}</>}
            {` · ${nSchede} ${nSchede === 1 ? "scheda" : "schede"} · ${r.capi} capi${capiStimati ? " (in parte stimati)" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chip("Acquisti", base, false)}
          {chip("Consuntivo", `${base}/consuntivo`, true)}
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${chiusoIl ? "border-[#B9D8C7] bg-[#EAF4EE] text-[#1D6B4A]" : "border-[#C9D5E8] bg-[#EEF2F8] text-[#1F3A68]"}`}>
        {chiusoIl
          ? <><span className="font-semibold">Consuntivo chiuso</span> il {formatData(chiusoIl)}: tutte le spese sono registrate, il margine reale è definitivo.</>
          : <><span className="font-semibold">Consuntivo aperto:</span> il margine reale è provvisorio finché non registri tutte le spese e chiudi il consuntivo.</>}
      </div>

      {(!vendita || (vendita && r.ricavo === 0) || senzaScheda > 0 || scontiDaVerificare > 0 || capiStimati || r.daRiassegnare > 0) && (
        <div role="alert" className="rounded-xl border border-[#E8C98A] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5B12] space-y-1">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Numeri da completare</div>
          {!vendita && <div>Order App non raggiungibile: senza i prezzi dei kit ricavo e margini non si calcolano.</div>}
          {vendita && r.ricavo === 0 && <div>Nell&apos;Order App l&apos;ordine non ha ancora prezzi: ricavo e margini non si calcolano.</div>}
          {senzaScheda > 0 && <div>{senzaScheda} {senzaScheda === 1 ? "articolo dell'ordine è" : "articoli dell'ordine sono"} senza scheda con i costi: il costo {aKit ? "dei kit" : "delle righe"} è incompleto.</div>}
          {scontiDaVerificare > 0 && <div>Sconti non in percentuale su {scontiDaVerificare} {scontiDaVerificare === 1 ? "riga" : "righe"}: il ricavo è senza sconto, verificalo nell&apos;Order App.</div>}
          {capiStimati && <div>Alcune schede non hanno ancora le taglie: il previsto usa i capi dell&apos;ordine.</div>}
          {r.daRiassegnare > 0 && (
            <div>
              {r.daRiassegnare} {r.daRiassegnare === 1 ? "spesa" : "spese"} di cartamodello da riassegnare con la matita: <strong>Piazzato</strong> se è stampa
              (costo dell&apos;ordine) o <strong>Sviluppo</strong> se sono taglie o modelli nuovi. Fino ad allora contano nel margine operativo.
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {tile("Previsto dalle schede", formatEuro(r.previsto), r.capi > 0 ? `${formatEuro(r.previsto / r.capi)} a capo` : null)}
        {tile("Speso", formatEuro(r.speso), r.capi > 0 && r.speso > 0 ? `${formatEuro(r.speso / r.capi)} a capo` : `${spese.length} spese`)}
        {tile(r.risparmio >= 0 ? "Risparmio" : "Extra costo",
          <span className={r.speso === 0 ? "text-[#5F6878]" : r.risparmio >= 0 ? "text-[#1D6B4A]" : "text-[#A8461F]"}>{formatEuro(Math.abs(r.risparmio))}</span>,
          r.speso === 0 ? "nessuna spesa ancora" : chiusoIl ? "rispetto al previsto" : "solo sulle fasi complete; le altre al previsto, o allo speso se già oltre")}
        {tile("Margine",
          <><span className={coloreMargine(r.marginePrevisto)}>{pct(r.marginePrevisto)}</span><span className="text-[#5F6878] text-base"> → </span><span className={coloreMargine(r.speso > 0 ? r.margineReale : null)}>{r.speso > 0 ? pct(r.margineReale) : "—"}</span></>,
          r.ricavo > 0
            ? <>
                previsto → {chiusoIl ? "reale" : "reale provvisorio"} operativo su {formatEuro(r.ricavo)} di vendita (imponibile, spedizione esclusa)
                {r.margineDopoSviluppo !== null && (
                  <span className="block mt-1 text-[13px] text-[#4A5566]">
                    Dopo sviluppo ({formatEuro(r.sviluppo)}): <strong className={coloreMargine(r.margineDopoSviluppo)}>{pct(r.margineDopoSviluppo)}</strong>
                  </span>
                )}
              </>
            : "manca il ricavo dall'Order App")}
      </div>

      {righe.length > 0 && (
        <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] min-w-[560px]">
              <thead>
                <tr className="border-b border-[#E4E0D6] bg-[#FBFAF7] text-left text-[13px] text-[#5F6878]">
                  <th className={`${cella} font-medium`}>Fase</th>
                  <th className={`${cella} font-medium text-right`}>Previsto</th>
                  <th className={`${cella} font-medium text-right`}>Speso</th>
                  <th className={`${cella} font-medium text-right`}>Differenza</th>
                  {!chiusoIl && fasiAttive && <th className={`${cella} font-medium text-center w-24`}>Completa</th>}
                </tr>
              </thead>
              <tbody>
                {righe.map((x) => {
                  const diff = x.previsto - x.speso;
                  const daRegistrare = x.nSpese === 0 && !chiusoIl && !x.completa;
                  // Aperta e sotto il previsto: il risparmio non conta finché la fase non è completa.
                  const inCorso = !chiusoIl && !x.completa && x.nSpese > 0 && diff > 0;
                  return (
                    <tr key={x.fase} className="border-b border-[#EFEBE2] last:border-0">
                      <td className={`${cella} font-semibold text-[#0E1B2C]`}>
                        {x.fase}{x.nSpese > 0 && <span className="font-normal text-xs text-[#5F6878]"> · {x.nSpese} {x.nSpese === 1 ? "spesa" : "spese"}</span>}
                        {x.fase === "Sviluppo" && x.nSpese > 0 && <span className="block font-normal text-xs text-[#5F6878]">fuori dal margine operativo</span>}
                        {x.fase === "Cartamodello" && <span className="block font-normal text-xs text-[#7A5B12]">da riassegnare: Piazzato o Sviluppo</span>}
                      </td>
                      <td className={`${cella} text-right font-mono text-[#4A5566]`}>{x.previsto > 0 ? formatEuro(x.previsto) : "—"}</td>
                      <td className={`${cella} text-right font-mono text-[#0E1B2C]`}>{x.speso > 0 ? formatEuro(x.speso) : "—"}</td>
                      <td className={`${cella} text-right font-mono ${daRegistrare || inCorso ? "text-[#8A8F98]" : diff >= 0 ? "text-[#1D6B4A]" : "text-[#A8461F]"}`}>
                        {daRegistrare ? "da registrare" : inCorso
                          ? <>in corso<span className="block text-xs font-sans">mancano {formatEuro(diff)}</span></>
                          : `${diff >= 0 ? "−" : "+"}${formatEuro(Math.abs(diff))}`}
                      </td>
                      {!chiusoIl && fasiAttive && (
                        // Senza previsto conta sempre lo speso: la spunta non cambierebbe niente.
                        <td className={`${cella} text-center`}>{x.previsto > 0 && <SpuntaFase ordineId={ordineId} fase={x.fase} completa={x.completa} />}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E4E0D6] bg-[#FBFAF7] font-semibold">
                  <td className={cella}>Totale</td>
                  <td className={`${cella} text-right font-mono`}>{formatEuro(r.previsto)}</td>
                  <td className={`${cella} text-right font-mono`}>{formatEuro(r.speso)}</td>
                  <td className={`${cella} text-right font-mono ${r.speso === 0 ? "text-[#8A8F98]" : r.risparmio >= 0 ? "text-[#1D6B4A]" : "text-[#A8461F]"}`}>
                    {r.speso === 0 ? "—" : `${r.risparmio >= 0 ? "−" : "+"}${formatEuro(Math.abs(r.risparmio))}`}
                  </td>
                  {!chiusoIl && fasiAttive && <td className={cella} />}
                </tr>
              </tfoot>
            </table>
          </div>
          {r.speso > 0 && (
            <div className="px-4 py-2.5 border-t border-[#E4E0D6] text-[13px] text-[#5F6878]">
              Con fattura (imponibile) <span className="font-mono text-[#0E1B2C]">{formatEuro(r.conFattura)}</span>
              {" · "}Senza fattura <span className="font-mono text-[#0E1B2C]">{formatEuro(r.senzaFattura)}</span>
            </div>
          )}
        </section>
      )}

      {margini.length > 0 && r.ricavo > 0 && (
        <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">Margine per {aKit ? "kit" : "articolo"}</h2>
            <span className="text-xs text-[#5F6878]">prezzi dall&apos;Order App · costo previsto dalle schede</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] min-w-[680px]">
              <thead>
                <tr className="border-y border-[#E4E0D6] bg-[#FBFAF7] text-left text-[13px] text-[#5F6878]">
                  <th className={`${cella} font-medium`}>{aKit ? "Kit" : "Articolo"}</th>
                  <th className={`${cella} font-medium text-right`}>Venduti</th>
                  <th className={`${cella} font-medium text-right`}>Prezzo{vendita && vendita.iva > 0 ? " (IVA escl.)" : ""}</th>
                  <th className={`${cella} font-medium text-right`}>Ricavo</th>
                  <th className={`${cella} font-medium text-right`}>Costo {aKit ? "kit" : "capo"}</th>
                  <th className={`${cella} font-medium text-right`}>Costo</th>
                  <th className={`${cella} font-medium text-right`}>Margine</th>
                </tr>
              </thead>
              <tbody>
                {margini.map((m, i) => (
                  <tr key={`${m.nome}${i}`} className="border-b border-[#EFEBE2] last:border-0">
                    <td className={`${cella} font-semibold text-[#0E1B2C]`}>
                      {m.nome}
                      {m.senzaScheda > 0 && <span className="block font-normal text-xs text-[#A8461F]">{m.senzaScheda} {m.senzaScheda === 1 ? "articolo senza scheda" : "articoli senza scheda"}</span>}
                    </td>
                    <td className={`${cella} text-right font-mono text-[#4A5566]`}>
                      {m.quantita}{m.omaggi > 0 && <span className="block text-xs text-[#5F6878]">+{m.omaggi} omaggio</span>}
                    </td>
                    <td className={`${cella} text-right font-mono text-[#4A5566]`}>
                      {m.prezzo > 0 ? formatEuro(m.prezzo) : "—"}
                      {m.prezzo > 0 && conIva(m.prezzo) !== null && <span className="block text-xs text-[#5F6878]">{formatEuro(conIva(m.prezzo)!)} IVA incl.</span>}
                    </td>
                    <td className={`${cella} text-right font-mono text-[#0E1B2C]`}>{m.ricavo > 0 ? formatEuro(m.ricavo) : "—"}</td>
                    <td className={`${cella} text-right font-mono text-[#4A5566]`}>{m.costoUnitario !== null ? formatEuro(m.costoUnitario) : "—"}</td>
                    <td className={`${cella} text-right font-mono text-[#0E1B2C]`}>{m.costo > 0 ? formatEuro(m.costo) : "—"}</td>
                    <td className={`${cella} text-right font-mono font-semibold ${coloreMargine(m.margine)}`}>{pct(m.margine)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {((vendita?.scontoOrdine ?? 0) > 0 || margini.some((m) => m.omaggi > 0)) && (
            <div className="px-4 py-2.5 border-t border-[#E4E0D6] text-[13px] text-[#5F6878]">
              {(vendita?.scontoOrdine ?? 0) > 0 && <>Sconto sull&apos;ordine di {formatEuro(vendita!.scontoOrdine)} ripartito sulle righe. </>}
              {margini.some((m) => m.omaggi > 0) && <>Gli omaggi entrano nel costo ma non nel ricavo.</>}
            </div>
          )}
        </section>
      )}

      {tessuto.length > 0 && (
        <section className="bg-white border border-[#E4E0D6] rounded-2xl px-4 py-3 space-y-2 text-sm">
          <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">Tessuto: quantità e prezzo</h2>
          {tessuto.map((t) => {
            const nTessuto = spese.filter((s) => s.fase === "Tessuto").length;
            const diffQ = t.daComprare != null ? t.comprato - t.daComprare : null;
            const diffP = t.prezzoListino != null ? t.prezzoMedio - t.prezzoListino : null;
            return (
              <div key={t.unita} className="space-y-0.5 text-[#4A5566]">
                <div>
                  Comprati <strong className="font-mono text-[#0E1B2C]">{num1(t.comprato)} {t.unita}</strong>
                  {t.daComprare != null && <> · previsti {num1(t.daComprare)} {t.unita} con scarto ({num1(t.netto!)} netti)</>}
                  {diffQ != null && <> · <strong className={`font-mono ${diffQ > 0 ? "text-[#A8461F]" : "text-[#1D6B4A]"}`}>{segno(diffQ, num1)} {t.unita}</strong></>}
                </div>
                <div>
                  Prezzo medio pagato <strong className="font-mono text-[#0E1B2C]">{formatEuro(t.prezzoMedio)}/{t.unita}</strong>
                  {t.prezzoListino != null && <> · listino {formatEuro(t.prezzoListino)}/{t.unita}</>}
                  {diffP != null && Math.abs(diffP) >= 0.005 && <> · <strong className={`font-mono ${diffP > 0 ? "text-[#A8461F]" : "text-[#1D6B4A]"}`}>{segno(diffP, formatEuro)}/{t.unita}</strong></>}
                </div>
                {t.nSpese < nTessuto && (
                  <div className="text-xs text-[#7A5B12]">Conta solo le spese con la quantità: {t.nSpese} di {nTessuto} spese di tessuto.</div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <SpeseOrdine
        ordineId={ordineId}
        chiusoIl={chiusoIl ? chiusoIl.toISOString() : null}
        spese={spese.map((s) => ({
          id: s.id, data: s.data, fase: s.fase, fornitore: s.fornitore, descrizione: s.descrizione,
          importo: s.importo, fattura: s.fattura, iva: s.iva, riferimento: s.riferimento, quantita: s.quantita, unita: s.unita,
        }))}
      />
    </div>
  );
}
