export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatData, calcolaTotaleQuantita, TAGLIE_ADULTO, TAGLIE_KIDS, CATEGORIE_ELASTICO, STATI_SCHEDA,
  calcolaAcquistoMateriale, calcolaCostoUnitarioConsumo, formatEuro, MARGINE_MINIMO, MARGINE_PIENO, SCARTO_ACQUISTO } from "@/lib/utils";
import type { ConsumoMateriale } from "@/types";
import { totaliReferenza, vociCosto } from "@/lib/costoReferenza";
import Testata from "@/components/mobile/Testata";
import { etichettaColore } from "@/lib/colori";
import { riferimentoColori } from "@/lib/coloriServer";
import Link from "next/link";
import { Lock, ShoppingCart } from "lucide-react";
import PulsantePdf from "@/components/ui/PulsantePdf";
import { FasiLista } from "@/components/scheda/FasiProduzione";
import { leggiFasi } from "@/lib/fasi";
import { ordiniOrderApp, nomeReferenza } from "@/lib/orderApp";
import { capiScheda, ETICHETTA_PARTE, partiReferenza, statoReferenza } from "@/lib/referenze";
import Miniatura from "@/components/ui/Miniatura";

function Blocco({ titolo, destra, children }: { titolo: string; destra?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#EFEBE2] flex items-baseline justify-between">
        <h2 className="font-display font-bold text-[16px]">{titolo}</h2>
        {destra}
      </div>
      {children}
    </section>
  );
}

function Righe({ righe }: { righe: { label: string; value: string | null | undefined }[] }) {
  return (
    <dl className="divide-y divide-[#EFEBE2]">
      {righe.filter((r) => r.value).map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-3 px-4 py-2.5">
          <dt className="text-[13px] text-[#5F6878] w-32 flex-shrink-0">{label}</dt>
          <dd className="text-[15px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

const SoloInterno = () => (
  <span className="flex items-center gap-1 text-[12px] text-[#A8461F] bg-[#FBEDE5] px-2 py-1 rounded-lg"><Lock size={12} /> Solo interno</span>
);

/** Consultazione della scheda dal telefono: sola lettura. Materiali e costo referenza sono interni, come nel PDF interno. */
export default async function MobileSchedaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await prisma.scheda.findUnique({ where: { id }, include: { cliente: true } });
  if (!scheda) notFound();
  const consumi: ConsumoMateriale[] = scheda.consumoMateriale ? JSON.parse(scheda.consumoMateriale) : [];
  const accessori: { nome: string; quantita: number; prezzoUnitario: number }[] = scheda.accessori ? JSON.parse(scheda.accessori) : [];
  const [rif, ordini, materiali] = await Promise.all([
    riferimentoColori(scheda.tessutoPrincipale),
    scheda.ordineOrderAppId ? ordiniOrderApp() : Promise.resolve([]),
    consumi.length ? prisma.materiale.findMany({ where: { id: { in: consumi.map((c) => c.materialeId) } } }) : Promise.resolve([]),
  ]);
  const ordine = scheda.ordineOrderAppId ? ordini.find((o) => o.id === scheda.ordineOrderAppId) : undefined;
  const ref = statoReferenza(scheda, ordine?.referenze ?? null);

  const quantita: Record<string, number> = scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {};
  const tabellaMisure = scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {};
  const totale = calcolaTotaleQuantita(quantita);
  // Senza taglie: i capi dell'ordine, come stima.
  const { capi, stimati } = capiScheda(quantita, ref.tipo === "collegata" ? ref.referenza : null);
  const immagini: string[] = scheda.immagini ? JSON.parse(scheda.immagini) : [];
  const taglieAttive = [...TAGLIE_ADULTO, ...TAGLIE_KIDS].filter((t) => quantita[t] || tabellaMisure[t]);
  const stato = STATI_SCHEDA.find((s) => s.value === scheda.stato);
  const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
  const specs = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;
  // Costi come nella scheda da computer e nel PDF interno: stesse funzioni, stessi numeri.
  // Schede vecchie col solo totale lavorazione: va in Confezione.
  const dettaglioLav = [scheda.costoTaglio, scheda.costoCucitura, scheda.costoStampa, scheda.costoRicamo].some((v) => v !== null);
  const voci = vociCosto({
    consumi, accessori,
    taglio: scheda.costoTaglio, cucitura: dettaglioLav ? scheda.costoCucitura : scheda.costoLavorazione,
    stampa: scheda.costoStampa, ricamo: scheda.costoRicamo,
  }, materiali, capi);
  const prezzoVendita = scheda.prezzoVendita || 0;
  const tot = totaliReferenza(voci, capi, prezzoVendita);
  const coloreMargine = tot.marginePct === null ? "text-[#5F6878]"
    : tot.marginePct >= MARGINE_PIENO ? "text-[#1D6B4A]" : tot.marginePct >= MARGINE_MINIMO ? "text-[#7A5B12]" : "text-[#A8461F]";
  const righeMateriali = consumi.flatMap((c) => {
    const mat = materiali.find((m) => m.id === c.materialeId);
    if (!mat) return [];
    const unitario = calcolaCostoUnitarioConsumo(mat);
    return [{ c, mat, unitario, isPz: mat.unitaMisura === "pz", acquisto: calcolaAcquistoMateriale(mat, c.consumoPerCapo, capi) }];
  });
  const materialiCapo = righeMateriali.reduce((t, r) => t + (r.c.consumoPerCapo || 0) * r.unitario, 0);
  const spesaOrdine = righeMateriali.reduce((t, r) => t + (r.acquisto?.stima ?? 0), 0);
  const misura = (t: string, k: string) => (tabellaMisure[t] as Record<string, number | undefined> | undefined)?.[k] ?? "—";

  return (
    <>
      <Testata indietro="/m/schede" elenco sopra={[scheda.codiceModello, scheda.codice].filter(Boolean).join(" · ")} titolo={scheda.nomeArticolo}
        destra={stato && <span className={`badge badge-${scheda.stato} flex-shrink-0 mb-2`}>{stato.label}</span>} />

      <div className="px-4 space-y-3 pb-6">
        {immagini.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
            {immagini.map((img, i) => (
              <a key={i} href={img} target="_blank" rel="noreferrer" className="snap-start flex-shrink-0">
                <Miniatura src={img} alt={`Immagine ${i + 1}`} lato={192} subito={i === 0} className="h-48 w-48 object-contain rounded-2xl bg-white border border-[#E4E0D6]" />
              </a>
            ))}
          </div>
        )}

        {ordine && (
          <div className={`rounded-2xl border px-4 py-3 text-[14px] ${ref.tipo === "non-piu-nell-ordine" ? "border-[#E8B4A0] bg-[#FBEDE5] text-[#A8461F]" : "border-[#C9D5E8] bg-[#EEF2F8] text-[#1F3A68]"}`}>
            <div className="font-semibold">{ordine.cliente} · <span className="font-mono">{ordine.id}</span></div>
            {ref.tipo === "collegata" && <div>Referenza: {nomeReferenza(ref.referenza)}{partiReferenza(ref.referenza).length > 1 || ref.parte === "bambino" ? ` · ${ETICHETTA_PARTE[ref.parte]}` : ""}{ref.referenza.capi ? ` · ${ref.referenza.capi} capi nell'ordine` : ""}</div>}
            {ref.tipo === "non-piu-nell-ordine" && <div><strong>Non più nell&apos;ordine</strong>: la referenza è stata tolta o sostituita. Va sistemata dal computer.</div>}
            {ref.tipo === "da-collegare" && <div>Non ancora collegata a una referenza dell&apos;ordine.</div>}
          </div>
        )}

        {scheda.stato === "esecutiva" && (
          <Blocco titolo="Avanzamento produzione">
            <div className="px-2 py-3"><FasiLista id={scheda.id} fasi={leggiFasi(scheda.fasi)} /></div>
          </Blocco>
        )}

        <Blocco titolo="Articolo">
          <Righe righe={[
            { label: "Modello", value: scheda.codiceModello },
            { label: "Cliente", value: scheda.cliente?.nome },
            { label: "Collezione", value: scheda.collezione },
            { label: "Categoria", value: scheda.categoria },
            { label: "Genere", value: scheda.genere },
            { label: "Vestibilità", value: scheda.vestibilita },
            { label: "Tessuto", value: scheda.tessutoPrincipale },
            { label: "Peso", value: scheda.pesoTessuto },
            { label: "Colore base", value: etichettaColore(scheda.coloreBase, scheda.coloreBaseCodice, rif.fornitore, rif.nomeFornitore(scheda.coloreBaseCodice)) },
            { label: "Colori secondari", value: etichettaColore(scheda.coloriSecondari, scheda.coloriSecondariCodice, rif.fornitore, rif.nomeFornitore(scheda.coloriSecondariCodice)) },
            { label: "Collo", value: scheda.collo },
            { label: "Maniche", value: scheda.maniche },
          ]} />
        </Blocco>

        {taglieAttive.length === 0 && stimati && (
          <Blocco titolo="Quantità" destra={<span className="font-mono font-semibold text-[#1F3A68]">{capi} pz</span>}>
            <p className="px-4 py-3 text-[14px] text-[#5F6878]">Taglie non ancora arrivate: {capi} capi dall&apos;ordine (stima).</p>
          </Blocco>
        )}

        {taglieAttive.length > 0 && (
          <Blocco titolo="Quantità" destra={totale > 0 && <span className="font-mono font-semibold text-[#1F3A68]">{totale} pz</span>}>
            <div className="grid grid-cols-4 gap-2 p-3">
              {taglieAttive.map((t) => (
                <div key={t} className="rounded-xl bg-[#F6F4EF] py-2 text-center">
                  <div className="text-xs text-[#5F6878]">{t}</div>
                  <div className="font-mono font-semibold text-lg">{quantita[t] || 0}</div>
                </div>
              ))}
            </div>
          </Blocco>
        )}

        {taglieAttive.some((t) => tabellaMisure[t]) && (
          <Blocco titolo={isElastico ? "Elastico vita" : "Misure (cm)"}>
            {isElastico && (specs?.altezza || specs?.tipo || specs?.costruzione || specs?.applicazione) && (
              <Righe righe={[
                { label: "Altezza", value: specs?.altezza ? `${specs.altezza} cm` : null },
                { label: "Tipo", value: specs?.tipo },
                { label: "Costruzione", value: specs?.costruzione },
                { label: "Applicazione", value: specs?.applicazione },
              ]} />
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 text-xs">Taglia</th>
                    {(isElastico ? ["Lungh. elastico", "Altezza"] : ["Torace", "Lungh.", "Spalla", "Manica"]).map((h) => (
                      <th key={h} className="px-2 py-2 text-xs text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taglieAttive.filter((t) => tabellaMisure[t]).map((t) => (
                    <tr key={t}>
                      <td className="px-4 py-2 font-semibold">{t}</td>
                      {(isElastico ? ["lunghezzaElastico", "altezzaElastico"] : ["torace", "lunghezza", "spalla", "lungManica"]).map((k) => (
                        <td key={k} className="px-2 py-2 text-right font-mono">{misura(t, k)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Blocco>
        )}

        {righeMateriali.length > 0 && (
          <Blocco titolo="Materiali" destra={<span className="font-mono font-semibold text-[#A8461F]">{formatEuro(materialiCapo)} / capo</span>}>
            <div className="divide-y divide-[#EFEBE2]">
              {righeMateriali.map(({ c, mat, unitario, isPz, acquisto }, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium">{mat.nome}{mat.unitaMisura === "kg" && <span className="text-[13px] text-[#5F6878]"> · al kg</span>}</div>
                      {mat.fornitore && <div className="text-[13px] text-[#5F6878]">{mat.fornitore}</div>}
                    </div>
                    <span className="font-mono font-semibold text-[15px] flex-shrink-0">{formatEuro((c.consumoPerCapo || 0) * unitario)}</span>
                  </div>
                  <div className="text-[13px] text-[#4A5566] font-mono mt-0.5">
                    {num1(c.consumoPerCapo || 0)} {isPz ? "pz" : "m"}/capo × {unitario > 0 ? `${formatEuro(unitario)}/${isPz ? "pz" : "m"}` : <span className="text-[#A8461F]">prezzo mancante</span>}
                  </div>
                  {acquisto && (
                    <div className="text-[13px] text-[#5F6878] mt-1">
                      {capi} capi{stimati && " (stima)"}
                      {acquisto.unita === "kg" && ` · ${num1(acquisto.metri!)} m = ${num1(acquisto.netto)} kg`}
                      {acquisto.unita === "m" && ` · ${num1(acquisto.netto)} m`}
                      {acquisto.unita !== "pz" && ` · +${SCARTO_ACQUISTO * 100}%`}
                      {" → da comprare "}<strong className="text-[#0E1B2C]">{acquisto.daComprare} {acquisto.unita}</strong>
                      {" · stima "}{acquisto.stima !== null ? <strong className="text-[#0E1B2C]">{formatEuro(acquisto.stima)}</strong> : <span className="text-[#A8461F]">manca il prezzo</span>}
                    </div>
                  )}
                </div>
              ))}
              {spesaOrdine > 0 && (
                <div className="px-4 py-3 flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-[#4A5566]">Acquisto per l&apos;ordine <span className="text-[12px] text-[#5F6878]">(tessuti +{SCARTO_ACQUISTO * 100}%)</span></span>
                  <strong className="font-mono text-[15px]">{formatEuro(spesaOrdine)}</strong>
                </div>
              )}
            </div>
          </Blocco>
        )}

        {capi > 0 && voci.length > 0 && (
          <Blocco titolo="Costo della referenza" destra={<span className="flex items-center gap-2"><span className="font-mono font-semibold text-[#1F3A68] text-[14px]">{capi} pz{stimati && " stim."}</span><SoloInterno /></span>}>
            <div className="divide-y divide-[#EFEBE2]">
              {voci.map((v, i) => {
                const dettaglio = v.fase === "Confezione" ? scheda.produttore || "fasonista non indicato" : v.dettaglio;
                const totVoce = v.perCapo * capi;
                const manca = v.manca && v.perCapo <= 0;
                return (
                  <div key={`${v.fase}${v.nome}${i}`} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium">{v.nome}</span>
                        {dettaglio && <span className="block text-[13px] text-[#5F6878] truncate">{dettaglio}</span>}
                      </div>
                      <span className="font-mono font-semibold text-[15px] flex-shrink-0">{manca ? "—" : formatEuro(totVoce)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-[13px] text-[#5F6878] font-mono mt-0.5">
                      <span className="truncate">{v.quantita ?? `${capi} pz`} · {manca ? <span className="text-[#A8461F]">manca</span> : `${formatEuro(v.perCapo)}/capo`}</span>
                      <span>{tot.totale > 0 && totVoce > 0 ? `${Math.round((totVoce / tot.totale) * 100)}%` : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-[#E4E0D6] px-4 py-3 space-y-2 text-[14px]">
              {[
                { label: "Costo totale", capo: formatEuro(tot.costoCapo), totale: formatEuro(tot.totale), pct: "", cls: "font-bold text-[#0E1B2C]" },
                { label: "Ricavo", capo: prezzoVendita > 0 ? formatEuro(prezzoVendita) : "—", totale: tot.ricavo > 0 ? formatEuro(tot.ricavo) : "—", pct: "", cls: "font-semibold text-[#0E1B2C]" },
                { label: "Margine", capo: tot.margine !== null ? formatEuro(tot.margine / capi) : "—", totale: tot.margine !== null ? formatEuro(tot.margine) : "—",
                  pct: tot.marginePct !== null ? `${tot.marginePct.toFixed(1).replace(".", ",")}%` : "", cls: `font-semibold ${coloreMargine}` },
              ].map((r) => (
                <div key={r.label} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-baseline">
                  <span className={r.label === "Costo totale" ? "font-semibold" : "text-[#4A5566]"}>{r.label}</span>
                  <span className="font-mono text-[13px] text-[#4A5566] text-right">{r.capo}<span className="text-[11px]">/capo</span></span>
                  <span className={`font-mono text-right min-w-[92px] ${r.cls}`}>{r.totale}{r.pct && <span className="block text-[12px]">{r.pct}</span>}</span>
                </div>
              ))}
              <p className="text-[12px] text-[#5F6878] leading-snug pt-1">
                Previsto dai costi della scheda, materiali al netto dello scarto. Lo speso reale è nel consuntivo dell&apos;ordine.
                {voci.some((v) => v.manca) && <span className="text-[#A8461F]"> Da completare: {voci.filter((v) => v.manca).map((v) => v.nome).join(", ")}.</span>}
                {prezzoVendita <= 0 && <span className="text-[#A8461F]"> Manca il prezzo di vendita.</span>}
              </p>
            </div>
          </Blocco>
        )}

        {(scheda.modellista || scheda.fornitoreTessuto || scheda.produttore) && (
          <Blocco titolo="Fornitori">
            <Righe righe={[
              { label: "Modellista", value: scheda.modellista },
              { label: "Fornitore tessuto", value: scheda.fornitoreTessuto },
              { label: "Produttore", value: scheda.produttore },
            ]} />
          </Blocco>
        )}

        {scheda.noteProduzione && (
          <Blocco titolo="Note per il produttore">
            <p className="px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line">{scheda.noteProduzione}</p>
          </Blocco>
        )}

        <div className="grid gap-2 pt-1">
          <PulsantePdf url={`/api/schede/${scheda.id}/pdf?tipo=tecnico`} nomeFile={`Scheda tecnica ${scheda.codice} ${scheda.nomeArticolo}.pdf`}
            etichetta="Stampa / invia scheda tecnica" />
          <PulsantePdf url={`/api/schede/${scheda.id}/pdf?tipo=interno`} nomeFile={`Scheda interna ${scheda.codice} ${scheda.nomeArticolo}.pdf`}
            etichetta="Scheda interna (con costi)" variante="bordo" />
          {ordine && (
            <Link href={`/m/acquisti/${encodeURIComponent(ordine.id)}`}
              className="h-12 rounded-xl border border-[#D6D1C4] bg-white text-[#0E1B2C] text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#FBFAF7]">
              <ShoppingCart size={18} /> Da acquistare per l&apos;ordine
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-[#5F6878] pt-1">
          Creata il {formatData(scheda.createdAt.toISOString())} · aggiornata il {formatData(scheda.updatedAt.toISOString())}
        </p>
      </div>
    </>
  );
}
