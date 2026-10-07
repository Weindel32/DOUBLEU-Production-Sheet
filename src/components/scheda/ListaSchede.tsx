import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import {
  formatData, STATI_SCHEDA, TIPI_COSTO_DB, calcolaTotaleQuantita, formatEuro, totaleSviluppo,
  FASCE_MODELLO, FASCIA_STYLE, ordinaCategorie,
} from "@/lib/utils";
import SchedaRowMenu from "@/components/scheda/SchedaRowMenu";
import { riepilogoScheda } from "@/lib/costiScheda";
import type { Campione } from "@/types";

type Filtri = { stato?: string; margine?: string; campioni?: string; fascia?: string; q?: string };
type Vista = "articoli" | "ordini";

const SOGLIA_MARGINE = 30;
const SENZA_MODELLO = "Senza modello";

const TESTI: Record<Vista, { titolo: string; base: string; nuovo: string; nuovoHref: string; vuoto: string; singolare: string; plurale: string }> = {
  articoli: {
    titolo: "Articoli e costi", base: "/articoli", nuovo: "Nuovo articolo", nuovoHref: "/schede/nuova?tipo=costo",
    vuoto: "Crea il primo articolo per calcolarne il costo per capo.", singolare: "articolo", plurale: "articoli",
  },
  ordini: {
    titolo: "Schede produzione", base: "/schede", nuovo: "Nuovo ordine", nuovoHref: "/schede/nuova",
    vuoto: "Crea la prima scheda di produzione, o parti da un articolo di costo.", singolare: "scheda", plurale: "schede",
  },
};

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/** Elenco schede: gli articoli di costo e gli ordini di produzione hanno pagine separate. */
export default async function ListaSchede({ vista, searchParams }: {
  vista: Vista;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = TESTI[vista];
  const str = (k: string) => (typeof searchParams[k] === "string" ? (searchParams[k] as string) : undefined);
  const filtri: Filtri = { stato: str("stato"), margine: str("margine"), campioni: str("campioni"), fascia: str("fascia"), q: str("q") };

  const hrefFiltri = (cambio: Filtri) => {
    const next = { ...filtri, ...cambio };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return qs ? `${t.base}?${qs}` : t.base;
  };

  const [schede, materiali, conteggiOrdini, modelli] = await Promise.all([
    prisma.scheda.findMany({
      where: vista === "articoli" ? { tipo: { in: TIPI_COSTO_DB } } : { tipo: { notIn: TIPI_COSTO_DB } },
      orderBy: { updatedAt: "desc" },
      include: { cliente: true },
    }),
    prisma.materiale.findMany(),
    vista === "articoli"
      ? prisma.scheda.groupBy({ by: ["origineId"], where: { origineId: { not: null } }, _count: { _all: true } })
      : Promise.resolve([]),
    vista === "articoli"
      ? prisma.modello.findMany({ select: { codice: true, categoria: true, fascia: true } })
      : Promise.resolve([]),
  ]);
  const ordiniPerArticolo = new Map(conteggiOrdini.map((c) => [c.origineId, c._count._all]));
  const modelloDi = new Map(modelli.map((m) => [m.codice, m]));

  const righe = schede.map((s) => {
    const costi = riepilogoScheda(s, materiali);
    const campioni = parseJson<Campione[]>(s.campioni, []);
    return {
      s,
      costi,
      copertina: parseJson<string[]>(s.immagini, [])[0],
      pezzi: calcolaTotaleQuantita(parseJson<Record<string, number>>(s.quantitaTaglia, {})),
      sviluppo: totaleSviluppo(campioni),
      nCampioni: campioni.length,
      nOrdini: ordiniPerArticolo.get(s.id) ?? 0,
      // Categoria e fascia vengono dal modello collegato, come nella pagina Modelli.
      modello: s.codiceModello ? modelloDi.get(s.codiceModello) : undefined,
    };
  });

  const q = filtri.q?.trim().toLowerCase();
  const filtrate = righe.filter(({ s, costi, nCampioni, modello }) =>
    (!filtri.stato || s.stato === filtri.stato) &&
    (!filtri.fascia || modello?.fascia === filtri.fascia) &&
    (filtri.margine !== "basso" || (costi.margine !== null && costi.margine < SOGLIA_MARGINE)) &&
    (filtri.campioni !== "si" || nCampioni > 0) &&
    (!q || [s.codice, s.codiceModello, s.nomeArticolo, s.cliente?.nome, s.categoria, s.collezione].some((v) => v?.toLowerCase().includes(q))),
  );

  const chip = (label: string, cambio: Filtri, attivo: boolean) => (
    <Link key={label} href={hrefFiltri(cambio)} aria-current={attivo ? "true" : undefined}
      className={`h-10 px-4 rounded-full border text-sm inline-flex items-center whitespace-nowrap transition-colors ${attivo ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
      {label}
    </Link>
  );

  // Articoli: un blocco per categoria del modello, nell'ordine di Modelli; senza modello in fondo.
  const gruppi = vista === "articoli"
    ? [
        ...ordinaCategorie(filtrate.flatMap((r) => (r.modello ? [r.modello.categoria] : []))).map((categoria) => ({
          categoria,
          righe: filtrate.filter((r) => r.modello?.categoria === categoria)
            .sort((a, b) => a.s.codiceModello!.localeCompare(b.s.codiceModello!, "it", { numeric: true }) || a.s.nomeArticolo.localeCompare(b.s.nomeArticolo)),
        })),
        { categoria: SENZA_MODELLO, righe: filtrate.filter((r) => !r.modello) },
      ].filter((g) => g.righe.length > 0)
    : [{ categoria: null, righe: filtrate }];

  const nessunFiltro = !filtri.stato && !filtri.margine && !filtri.campioni && !filtri.fascia && !filtri.q;
  const isArticoli = vista === "articoli";
  const cella = "px-3 py-2.5";
  const numero = `${cella} text-right font-mono whitespace-nowrap`;

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">{t.titolo}</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            {schede.length} {schede.length === 1 ? t.singolare : t.plurale}
            {isArticoli && " · costo per capo per preventivi e ordini, sviluppo campioni a parte"}
          </p>
        </div>
        <form action={t.base} className="w-full sm:w-80">
          {filtri.stato && <input type="hidden" name="stato" value={filtri.stato} />}
          {filtri.margine && <input type="hidden" name="margine" value={filtri.margine} />}
          {filtri.campioni && <input type="hidden" name="campioni" value={filtri.campioni} />}
          {filtri.fascia && <input type="hidden" name="fascia" value={filtri.fascia} />}
          <label className="h-12 border border-[#D6D1C4] rounded-xl bg-white flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
            <Search size={18} />
            <input type="search" name="q" defaultValue={filtri.q} placeholder={isArticoli ? "Cerca codice o articolo" : "Cerca codice, articolo, cliente"} aria-label="Cerca"
              className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-[15px]" />
          </label>
        </form>
        <Link href={t.nuovoHref}
          className="h-12 px-5 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2">
          <Plus size={18} /> {t.nuovo}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip("Tutti", { stato: undefined, margine: undefined, campioni: undefined, fascia: undefined }, nessunFiltro || (!filtri.stato && !filtri.margine && !filtri.campioni && !filtri.fascia))}
        {isArticoli && FASCE_MODELLO.map((f) => chip(f, { fascia: filtri.fascia === f ? undefined : f }, filtri.fascia === f))}
        {isArticoli && <span aria-hidden className="w-px h-6 bg-[#D6D1C4] mx-1" />}
        {!isArticoli && STATI_SCHEDA.map((st) => chip(st.label, { stato: filtri.stato === st.value ? undefined : st.value }, filtri.stato === st.value))}
        {chip(`Margine sotto ${SOGLIA_MARGINE}%`, { margine: filtri.margine === "basso" ? undefined : "basso" }, filtri.margine === "basso")}
        {isArticoli && chip("Con campioni", { campioni: filtri.campioni === "si" ? undefined : "si" }, filtri.campioni === "si")}
      </div>

      {filtrate.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-16 px-6">
          <FileText size={44} className="mx-auto mb-4 text-[#5F6878]" />
          <h2 className="font-display text-lg font-bold text-[#0E1B2C] mb-1">
            {schede.length === 0 ? `Nessun${isArticoli ? " articolo" : "a scheda"}` : "Niente con questi filtri"}
          </h2>
          <p className="text-[#5F6878] text-sm mb-5">{schede.length === 0 ? t.vuoto : "Togli qualche filtro o cambia ricerca."}</p>
          {schede.length === 0
            ? <Link href={t.nuovoHref} className="h-11 px-5 rounded-xl bg-[#0E1B2C] text-white text-sm font-semibold inline-flex items-center gap-2"><Plus size={16} /> {t.nuovo}</Link>
            : <Link href={t.base} className="h-11 px-5 rounded-xl border border-[#D6D1C4] text-[#0E1B2C] text-sm font-medium inline-flex items-center">Mostra tutti</Link>}
        </div>
      ) : (
        <div className="space-y-5">
          {gruppi.map((g) => (
            <section key={g.categoria ?? "tutte"} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
              {g.categoria && (
                <div className="px-5 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] flex items-baseline justify-between">
                  <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">{g.categoria}</h2>
                  <span className="text-xs text-[#5F6878]">{g.righe.length} {g.righe.length === 1 ? t.singolare : t.plurale}</span>
                </div>
              )}
              <div className="overflow-x-auto">
                {/* Larghezze fisse negli articoli: le colonne restano allineate tra un blocco e l'altro. */}
                <table className={`w-full text-[15px] min-w-[860px] ${isArticoli ? "table-fixed" : ""}`}>
                  {isArticoli && (
                    <colgroup>
                      <col className="w-[72px]" /><col className="w-[140px]" /><col />
                      <col className="w-[110px]" /><col className="w-[100px]" /><col className="w-[90px]" />
                      <col className="w-[120px]" /><col className="w-[76px]" /><col className="w-[110px]" /><col className="w-12" />
                    </colgroup>
                  )}
                  <thead>
                    <tr className="border-b border-[#E4E0D6] text-left">
                      <th className="pl-4 pr-2 py-3 w-[72px]"><span className="sr-only">Foto</span></th>
                      <th className={cella}>Modello / codice</th>
                      <th className={cella}>Articolo</th>
                      {!isArticoli && <th className={cella}>Cliente</th>}
                      <th className={`${cella} text-right`}>Costo / capo</th>
                      <th className={`${cella} text-right`}>Prezzo</th>
                      <th className={`${cella} text-right`}>Margine</th>
                      {isArticoli && <th className={`${cella} text-right`}>Sviluppo</th>}
                      {isArticoli && <th className={`${cella} text-right`}>Ordini</th>}
                      <th className={cella}>{isArticoli ? "Aggiornato" : "Stato"}</th>
                      <th className="px-3 py-3 w-12"><span className="sr-only">Azioni</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.righe.map(({ s, costi, copertina, pezzi, sviluppo, nCampioni, nOrdini, modello }) => {
                      const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
                      // Negli articoli categoria e fascia sono già nel blocco e nel badge.
                      const dettagli = isArticoli
                        ? (modello ? null : s.categoria)
                        : [s.categoria, s.genere, pezzi > 0 ? `${pezzi} pz` : null].filter(Boolean).join(" · ");
                      const margineCls = costi.margine === null ? "text-[#5F6878]" : costi.margine < SOGLIA_MARGINE ? "text-[#A8461F]" : "text-[#1D6B4A]";
                      const href = `${t.base}/${s.id}`;
                      return (
                        <tr key={s.id} className="border-b border-[#EFEBE2] last:border-0">
                          <td className="pl-4 pr-2 py-2.5">
                            <Link href={href} tabIndex={-1} aria-hidden className="block w-14 h-14 rounded-[10px] bg-[#EEEBE3] overflow-hidden">
                              {copertina && <img src={copertina} alt="" className="w-full h-full object-cover" />}
                            </Link>
                          </td>
                          <td className={`${cella} font-mono text-sm whitespace-nowrap`}>
                            {s.codiceModello
                              ? <><span className="font-semibold text-[#0E1B2C]">{s.codiceModello}</span><div className="text-xs text-[#5F6878]">{s.codice}</div></>
                              : <span className="text-[#0E1B2C]">{s.codice}</span>}
                          </td>
                          <td className={cella}>
                            <Link href={href} className="font-semibold text-[#0E1B2C] hover:text-[#1F3A68] hover:underline underline-offset-2">
                              {s.nomeArticolo}
                            </Link>
                            {modello && (
                              <span className={`ml-2 align-middle text-xs font-semibold px-2 py-0.5 rounded-full ${FASCIA_STYLE[modello.fascia] ?? "bg-[#EEEBE3] text-[#4A5566]"}`}>
                                {modello.fascia}
                              </span>
                            )}
                            {dettagli && <div className="text-[13px] text-[#5F6878]">{dettagli}</div>}
                          </td>
                          {!isArticoli && <td className={`${cella} ${s.cliente ? "font-semibold text-[#1F3A68]" : "text-[#5F6878]"}`}>{s.cliente?.nome || "—"}</td>}
                          <td className={numero}>{costi.totale > 0 ? formatEuro(costi.totale) : "—"}</td>
                          <td className={numero}>{costi.prezzoVendita > 0 ? formatEuro(costi.prezzoVendita) : "—"}</td>
                          <td className={`${numero} font-semibold ${margineCls}`}>
                            {costi.margine === null ? "—" : `${costi.margine.toFixed(1).replace(".", ",")}%`}
                          </td>
                          {isArticoli && (
                            <td className={`${numero} text-[#1F3A68]`}>
                              {nCampioni > 0 ? formatEuro(sviluppo) : "—"}
                              {nCampioni > 0 && <div className="text-xs text-[#5F6878] font-sans">{nCampioni} {nCampioni === 1 ? "campione" : "campioni"}</div>}
                            </td>
                          )}
                          {isArticoli && <td className={numero}>{nOrdini || "—"}</td>}
                          <td className={cella}>
                            {!isArticoli && stato && <span className={`badge badge-${s.stato}`}>{stato.label}</span>}
                            <div className={`text-xs text-[#5F6878] ${isArticoli ? "" : "mt-1"}`}>{formatData(s.updatedAt)}</div>
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <SchedaRowMenu id={s.id} nome={s.nomeArticolo} statoCorrente={s.stato} base={t.base} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
