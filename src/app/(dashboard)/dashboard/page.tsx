export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  ArrowUpRight, CalendarClock, CircleAlert, Link2, Ruler, Scissors, Tag, PackageX, FilePlus2, Unlink, ShoppingCart, FileText, CheckCircle2,
} from "lucide-react";
import { datiDashboard, type AzioneDaFare, type Urgenza } from "@/lib/dashboard";
import { MARGINE_MINIMO, SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import PianoProduzione from "@/components/dashboard/PianoProduzione";

const ICONA_AZIONE: Record<AzioneDaFare["tipo"], typeof Tag> = {
  "senza-scheda": FilePlus2, "da-collegare": Link2, orfana: Unlink, taglie: Ruler, consumi: Scissors, prezzo: Tag, materiale: PackageX, ritardo: CalendarClock,
};

const URGENZA: Record<Urgenza, { chip: string; barra: string }> = {
  scaduto: { chip: "bg-[#A8461F] text-white", barra: "bg-[#A8461F]" },
  preavviso: { chip: "bg-[#FBEDE5] text-[#A8461F] ring-1 ring-[#F2D2C1]", barra: "bg-[#C9773F]" },
  ok: { chip: "bg-[#E3EFE8] text-[#1D6B4A] ring-1 ring-[#C6E0D1]", barra: "bg-[#1F3A68]" },
  "senza-data": { chip: "bg-[#EEEBE3] text-[#4A5566]", barra: "bg-[#1F3A68]" },
};

const testoGiorni = (g: number | null) =>
  g === null ? "Consegna da fissare" : g < 0 ? `Scaduto da ${-g} ${g === -1 ? "giorno" : "giorni"}` : g === 0 ? "Consegna oggi" : g === 1 ? "Consegna domani" : `Consegna tra ${g} giorni`;

function Titolo({ children, destra }: { children: React.ReactNode; destra?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="font-display text-[19px] font-bold tracking-tight text-[#0E1B2C]">{children}</h2>
      {destra}
    </div>
  );
}

export default async function DashboardPage() {
  const d = await datiDashboard();
  const oggi = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
  const ora = new Date().toLocaleString("it-IT", { hour: "numeric", hour12: false, timeZone: "Europe/Rome" });
  const saluto = +ora < 13 ? "Buongiorno" : +ora < 18 ? "Buon pomeriggio" : "Buonasera";
  const inScadenza = d.ordini.filter((o) => o.urgenza === "preavviso" || o.urgenza === "scaduto").length;
  const urgenti = d.azioni.filter((a) => a.urgenza === "scaduto" || a.urgenza === "preavviso").length;

  const kpi = [
    { label: "Ordini in lavorazione", valore: String(d.ordini.length), nota: `${d.ordini.reduce((t, o) => t + o.capi, 0)} capi` },
    { label: "In scadenza", valore: String(inScadenza), nota: "entro il preavviso", allerta: inScadenza > 0 },
    { label: "Da fare", valore: String(d.azioni.length), nota: urgenti ? `${urgenti} su ordini in scadenza` : "nessuna urgenza", allerta: urgenti > 0 },
    { label: "Tessuto da comprare", valore: formatEuro(d.tessuto.totale).replace(/,00$/, ""), nota: d.tessuto.provvisorio ? "stima provvisoria" : "stima sugli ordini aperti" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0E1B2C] text-white px-7 py-7 lg:px-9 lg:py-8 shadow-[0_20px_50px_-24px_rgba(14,27,44,0.6)]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(31,58,104,0.9),transparent_60%)]" />
        <div aria-hidden className="absolute left-0 top-0 h-full w-1 flex flex-col">
          <span className="flex-1 bg-[#009246]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-[#CE2B37]" />
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold tracking-[0.22em] uppercase text-[#9FB0C8]">Double U · Production</div>
              <h1 className="font-display text-[34px] lg:text-[40px] font-extrabold tracking-tight leading-tight mt-1">{saluto}</h1>
              <p className="text-[15px] text-[#B7C4D8] first-letter:uppercase">{oggi}</p>
            </div>
            <Link href="/schede" className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-sm font-semibold inline-flex items-center gap-2">
              Schede produzione <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-7 rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/10">
            {kpi.map((k) => (
              <div key={k.label} className="bg-[#0E1B2C]/70 backdrop-blur px-5 py-4">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-[#9FB0C8]">{k.label}</div>
                <div className={`font-display text-[30px] font-extrabold tracking-tight leading-none mt-2 ${k.allerta ? "text-[#F2A488]" : "text-white"}`}>{k.valore}</div>
                <div className="text-[12px] text-[#9FB0C8] mt-1.5">{k.nota}</div>
              </div>
            ))}
          </div>

          {d.preventivi.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-5 text-[13px]">
              <span className="text-[#9FB0C8]">Preventivi aperti · {d.preventivi.length}</span>
              {d.preventivi.map((p) => (
                <Link key={p.id} href={p.schede ? `/schede?q=${encodeURIComponent(p.id)}` : `/schede/nuova?ordine=${encodeURIComponent(p.id)}`}
                  title={p.id}
                  className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 inline-flex items-center gap-1.5">
                  <span className="font-semibold text-white">{p.cliente}</span>
                  <span className="text-[#9FB0C8]">· {p.schede ? `${p.schede} ${p.schede === 1 ? "scheda" : "schede"}` : "da impostare"}</span>
                </Link>
              ))}
            </div>
          )}
          {!d.orderAppOk && <p className="mt-5 text-[13px] text-[#F2A488]">Order App non raggiungibile: ordini e tessuto non sono aggiornati.</p>}
        </div>
      </section>

      {/* ── Ordini in lavorazione ─────────────────────────── */}
      <section id="ordini">
        <Titolo destra={<span className="text-[13px] text-[#5F6878]">confermati e in produzione · per data di consegna</span>}>Ordini in lavorazione</Titolo>
        {d.ordini.length === 0 ? (
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-10 text-center text-[#5F6878]">Nessun ordine confermato o in produzione.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {d.ordini.map((o) => {
              const u = URGENZA[o.urgenza];
              const avanzamento = o.referenze ? Math.min(100, Math.round(((o.esecutive) / o.referenze) * 100)) : 0;
              const coperte = o.referenze ? Math.min(100, Math.round((o.coperte / o.referenze) * 100)) : 0;
              return (
                <article key={o.id} className="group bg-white border border-[#E4E0D6] rounded-2xl p-5 flex flex-col gap-4 shadow-[0_1px_2px_rgba(14,27,44,0.04)] hover:shadow-[0_12px_30px_-18px_rgba(14,27,44,0.35)] hover:border-[#D6D1C4] transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-[19px] font-bold tracking-tight text-[#1F3A68] truncate">{o.cliente}</h3>
                      <div className="text-[13px] text-[#5F6878] mt-0.5"><span className="font-mono">{o.id}</span> · {statoOrdine(o.stato)}</div>
                    </div>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold ${u.chip}`}>
                      <CalendarClock size={14} /> {testoGiorni(o.giorni)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-[13px] mb-1.5">
                      <span className="text-[#4A5566]"><strong className="text-[#0E1B2C] font-semibold">{o.esecutive}</strong> {o.esecutive === 1 ? "esecutiva" : "esecutive"} su {o.referenze} {o.referenze === 1 ? "referenza" : "referenze"}</span>
                      <span className="font-mono text-[#5F6878]">{o.capi} capi</span>
                    </div>
                    {/* Barra: scuro = esecutive, chiaro = schede create, vuoto = referenze senza scheda */}
                    <div className="relative h-2 rounded-full bg-[#EEEBE3] overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-[#C9D5E8]" style={{ width: `${coperte}%` }} />
                      <div className={`absolute inset-y-0 left-0 ${u.barra}`} style={{ width: `${avanzamento}%` }} />
                    </div>
                  </div>

                  <PianoProduzione ordineId={o.id} piano={o.produzione} consegna={o.consegna} />

                  <dl className="grid grid-cols-3 gap-2 text-[12px]">
                    <div className="rounded-xl bg-[#F6F4EF] px-3 py-2">
                      <dt className="text-[#5F6878]">Senza scheda</dt>
                      <dd className={`font-display text-[17px] font-bold ${o.senzaScheda ? "text-[#A8461F]" : "text-[#0E1B2C]"}`}>{o.senzaScheda}</dd>
                    </div>
                    <div className="rounded-xl bg-[#F6F4EF] px-3 py-2">
                      <dt className="text-[#5F6878]">Taglie arrivate</dt>
                      <dd className="font-display text-[17px] font-bold text-[#0E1B2C]">{o.conTaglie}<span className="text-[#5F6878] text-[13px] font-medium">/{o.referenze}</span></dd>
                    </div>
                    <div className="rounded-xl bg-[#F6F4EF] px-3 py-2">
                      <dt className="text-[#5F6878]">Conto tessuto</dt>
                      <dd className={`font-display text-[15px] font-bold mt-0.5 ${o.provvisorio ? "text-[#7A5B12]" : "text-[#1D6B4A]"}`}>{o.provvisorio ? "Provvisorio" : "Definitivo"}</dd>
                    </div>
                  </dl>

                  <div className="flex gap-2 mt-auto">
                    <Link href={`/schede?q=${encodeURIComponent(o.id)}`} className="flex-1 h-10 rounded-xl border border-[#D6D1C4] text-[13px] font-semibold text-[#0E1B2C] inline-flex items-center justify-center gap-1.5 hover:border-[#0E1B2C]/40">
                      <FileText size={15} /> Schede
                    </Link>
                    <Link href={`/schede/ordine/${encodeURIComponent(o.id)}`} className="flex-1 h-10 rounded-xl bg-[#0E1B2C] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#1F3A68]">
                      <ShoppingCart size={15} /> Acquisti
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Da fare + Margini ─────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
        <section>
          <Titolo destra={<span className="text-[13px] text-[#5F6878]">prima gli ordini in scadenza</span>}>Da fare</Titolo>
          <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
            {d.azioni.length === 0 ? (
              <div className="p-8 text-center text-[#1D6B4A] flex flex-col items-center gap-2">
                <CheckCircle2 size={28} /> <span className="font-semibold">Tutto in ordine</span>
              </div>
            ) : (
              <ul className="divide-y divide-[#EFEBE2]">
                {d.azioni.slice(0, 12).map((a, i) => {
                  const Icona = ICONA_AZIONE[a.tipo];
                  const urgente = a.urgenza === "scaduto" || a.urgenza === "preavviso";
                  return (
                    <li key={i}>
                      <Link href={a.href} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#FBFAF7] group">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${urgente ? "bg-[#FBEDE5] text-[#A8461F]" : "bg-[#EEF2F8] text-[#1F3A68]"}`}>
                          <Icona size={17} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] font-semibold text-[#0E1B2C] truncate">{a.testo}</span>
                          <span className="block text-[12px] text-[#5F6878] truncate">{a.dettaglio}</span>
                        </span>
                        {urgente && <CircleAlert size={16} className="text-[#A8461F] flex-shrink-0" aria-label="In scadenza" />}
                        <ArrowUpRight size={16} className="text-[#C9C3B5] group-hover:text-[#1F3A68] flex-shrink-0" />
                      </Link>
                    </li>
                  );
                })}
                {d.azioni.length > 12 && <li className="px-5 py-3 text-[13px] text-[#5F6878]">e altre {d.azioni.length - 12}</li>}
              </ul>
            )}
          </div>
        </section>

        <section>
          <Titolo destra={<span className="text-[13px] text-[#5F6878]">sotto il {MARGINE_MINIMO}%</span>}>Margini a rischio</Titolo>
          <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
            {d.margini.length === 0 ? (
              <div className="p-8 text-center text-[#1D6B4A] flex flex-col items-center gap-2">
                <CheckCircle2 size={28} /> <span className="font-semibold">Nessuna scheda sotto il {MARGINE_MINIMO}%</span>
              </div>
            ) : (
              <ul className="divide-y divide-[#EFEBE2]">
                {d.margini.slice(0, 8).map((m) => (
                  <li key={m.id}>
                    <Link href={`/schede/${m.id}#sez-costi`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FBFAF7]">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold text-[#0E1B2C] truncate">{m.nome}</span>
                        <span className="block text-[12px] text-[#5F6878] truncate">
                          {[m.cliente, `costo ${formatEuro(m.costo)}`, `prezzo ${formatEuro(m.prezzo)}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="font-display text-[20px] font-extrabold text-[#A8461F] tabular-nums">{m.margine!.toFixed(1).replace(".", ",")}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ── Tessuto da comprare ───────────────────────────── */}
      <section>
        <Titolo destra={<span className="text-[13px] text-[#5F6878]">tutti gli ordini in lavorazione · +{SCARTO_ACQUISTO * 100}% di scarto</span>}>Tessuto da comprare</Titolo>
        {d.tessuto.fornitori.length === 0 ? (
          <div className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">Ancora niente da comprare: servono quantità e consumi nelle schede degli ordini.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {d.tessuto.fornitori.map((g) => (
              <div key={g.fornitore || "nessuno"} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-[#FBFAF7] border-b border-[#E4E0D6] flex items-baseline justify-between">
                  <h3 className="font-display font-bold text-[16px] text-[#0E1B2C]">{g.fornitore || "Fornitore non indicato"}</h3>
                  <span className="font-mono text-[14px] font-semibold text-[#0E1B2C]">{formatEuro(g.stima)}</span>
                </div>
                <ul className="divide-y divide-[#EFEBE2]">
                  {g.righe.map((r) => (
                    <li key={`${r.materiale.id}${r.codiceColore}${r.colore}`} className="px-5 py-3 flex items-center gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold text-[#0E1B2C] truncate">{r.materiale.nome}</span>
                        <span className="block text-[12px] text-[#5F6878] truncate">{r.coloreEtichetta ?? "colore da definire"} · {r.referenze.length} {r.referenze.length === 1 ? "referenza" : "referenze"}</span>
                      </span>
                      <span className="font-mono text-[16px] font-bold text-[#0E1B2C] whitespace-nowrap">{r.acquisto ? quantitaAcquisto(r.acquisto) : "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {d.tessuto.provvisorio && d.tessuto.fornitori.length > 0 && (
          <p className="text-[13px] text-[#7A5B12] mt-3">Stima provvisoria: alcune referenze non hanno ancora le taglie e usano i capi dell&apos;ordine.</p>
        )}
      </section>
    </div>
  );
}
