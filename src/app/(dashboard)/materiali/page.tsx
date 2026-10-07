export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, Palette } from "lucide-react";
import MaterialiActions from "./MaterialiActions";
import { calcolaCostoAlMetro, calcolaGrammaturaCommerciale, formatEuro } from "@/lib/utils";
import { chiaveFornitore, coloriTessuto, COLORI_DOUBLEU, dizionarioFornitore, leggiCodici, leggiNomiTessuto } from "@/lib/colori";
import BadgeColori from "@/components/materiali/BadgeColori";
import FiltriMateriali from "@/components/materiali/FiltriMateriali";

// Ordine dei blocchi, come le scelte del tipo nel form; i tipi non previsti vanno in fondo.
const TIPI = ["Tessuto", "Fodera", "Elastico", "Cerniera", "Bottoni", "Ricamo", "Stampa", "Altro"];
const PLURALE: Record<string, string> = {
  Tessuto: "Tessuti", Fodera: "Fodere", Elastico: "Elastici", Cerniera: "Cerniere",
  Bottoni: "Bottoni", Ricamo: "Ricami", Stampa: "Stampe", Altro: "Altro",
};
const UNITA_LABEL: Record<string, string> = { metro: "/m", kg: "/kg", pz: "/pz" };
const GRIGLIA = "grid grid-cols-[48px_minmax(0,1.3fr)_minmax(0,1.5fr)_130px_140px_76px] items-center gap-x-5";

export default async function MaterialiPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const filtri = { q: str("q"), colore: str("colore"), fornitore: str("fornitore") };

  const [tutti, voci] = await Promise.all([
    prisma.materiale.findMany({ orderBy: { nome: "asc" } }),
    prisma.coloreFornitore.findMany(),
  ]);
  const righe = tutti.map((m) => ({ m, colori: coloriTessuto(leggiCodici(m.colori), dizionarioFornitore(voci, m.fornitore), leggiNomiTessuto(m.coloriNomi)) }));

  // Il filtro lavora sui colori DOUBLEU, così "Navy" trova i tessuti di tutti i fornitori.
  const presenti = new Set(righe.flatMap((r) => r.colori.map((c) => c.doubleu)));
  const nomiColore = COLORI_DOUBLEU.map((c) => c.nome).filter((n) => presenti.has(n));
  const fornitori = [...new Set(tutti.map((m) => m.fornitore?.trim()).filter((f): f is string => !!f))]
    .sort((a, b) => a.localeCompare(b));

  const q = filtri.q.toLowerCase();
  const visibili = righe.filter(({ m, colori }) =>
    (!filtri.colore || colori.some((c) => c.doubleu === filtri.colore)) &&
    (!filtri.fornitore || chiaveFornitore(m.fornitore) === chiaveFornitore(filtri.fornitore)) &&
    (!q || [m.nome, m.codice, m.composizione, m.fornitore].some((v) => v?.toLowerCase().includes(q))));

  const tipi = [...TIPI, ...new Set(visibili.map((r) => r.m.tipo).filter((t) => !TIPI.includes(t)))];
  const gruppi = tipi.map((tipo) => ({ tipo, righe: visibili.filter((r) => r.m.tipo === tipo) })).filter((g) => g.righe.length > 0);
  const filtrato = !!(filtri.q || filtri.colore || filtri.fornitore);

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">Materiali</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            {filtrato ? `${visibili.length} su ${tutti.length} materiali` : `${tutti.length} materiali in libreria`}
            {filtri.colore && ` · disponibili in ${filtri.colore}`}
          </p>
        </div>
        <Link href="/materiali/colori"
          className="h-12 px-4 rounded-xl border border-[#D6D1C4] bg-white text-[15px] font-medium text-[#0E1B2C] inline-flex items-center gap-2 hover:border-[#0E1B2C]/40">
          <Palette size={18} /> Colori fornitori
        </Link>
        <Link href="/materiali/nuovo"
          className="h-12 px-5 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2">
          <Plus size={18} /> Nuovo materiale
        </Link>
      </div>

      <FiltriMateriali {...filtri} colori={nomiColore} fornitori={fornitori} />

      {gruppi.length === 0 && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-14 px-6">
          <Package size={40} className="mx-auto mb-3 text-[#5F6878]" />
          <p className="text-[#5F6878] mb-4">{tutti.length === 0 ? "Nessun materiale in libreria." : "Nessun materiale con questi filtri."}</p>
          {filtrato && <Link href="/materiali" className="h-11 px-5 rounded-xl border border-[#D6D1C4] text-sm font-medium inline-flex items-center">Mostra tutti</Link>}
        </div>
      )}

      {gruppi.map((g) => (
        <section key={g.tipo} className="bg-white border border-[#E4E0D6] rounded-2xl">
          <div className="px-5 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] rounded-t-2xl flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">{PLURALE[g.tipo] ?? g.tipo}</h2>
            <span className="text-xs text-[#5F6878]">{g.righe.length}</span>
          </div>
          <div className={`${GRIGLIA} px-5 py-2 border-b border-[#EFEBE2] text-[11px] font-semibold uppercase tracking-wider text-[#5F6878]`}>
            <span /><span>Materiale</span><span>Specifiche</span><span>Colori</span><span className="text-right">Prezzo</span><span />
          </div>
          <ul>
            {g.righe.map(({ m, colori }) => {
              const unita = m.unitaMisura ?? "metro";
              const alMetro = calcolaCostoAlMetro(m);
              const grammatura = calcolaGrammaturaCommerciale(m);
              const href = `/materiali/${m.id}/modifica`;
              const sotto = [m.fornitore, m.codice].filter(Boolean).join(" · ");
              const misure = [
                m.peso ? `${m.peso} ${m.unitaPeso ?? "g/m²"}` : null,
                m.larghezza ? `${m.larghezza} cm` : null,
                grammatura !== null && m.unitaPeso !== "g/m²" ? `${grammatura.toFixed(0)} g/m²` : null,
              ].filter(Boolean).join(" · ");
              return (
                <li key={m.id} className={`${GRIGLIA} px-5 py-2.5 border-b border-[#EFEBE2] last:border-0`}>
                  <Link href={href} tabIndex={-1} aria-hidden className="w-12 h-12 rounded-[10px] bg-[#EEEBE3] overflow-hidden flex items-center justify-center text-[#9AA3B2]">
                    {m.foto ? <img src={m.foto} alt="" className="w-full h-full object-cover" /> : <Package size={18} />}
                  </Link>
                  <div className="min-w-0">
                    <Link href={href} className="block font-semibold text-[15px] leading-snug text-[#0E1B2C] line-clamp-2 hover:text-[#1F3A68] hover:underline underline-offset-2">{m.nome}</Link>
                    {sotto && <div className="text-[13px] text-[#5F6878] truncate">{sotto}</div>}
                  </div>
                  <div className="min-w-0 text-[14px]">
                    {m.composizione && <div className="text-[#0E1B2C] truncate">{m.composizione}</div>}
                    {misure ? <div className={`truncate ${m.composizione ? "text-[13px] text-[#5F6878]" : "text-[#0E1B2C]"}`}>{misure}</div>
                      : !m.composizione && <span className="text-[#5F6878]">—</span>}
                  </div>
                  <BadgeColori colori={colori} fornitore={chiaveFornitore(m.fornitore) || null}
                    cartellaData={m.cartellaData} cartellaFoto={m.cartellaFoto} hrefModifica={href} />
                  <div className="text-right font-mono whitespace-nowrap">
                    {unita === "kg" ? (
                      <>
                        <div className="text-[14px] text-[#0E1B2C]">{alMetro !== null ? `${formatEuro(alMetro)}/m` : "—"}</div>
                        {m.prezzoKg ? <div className="text-xs text-[#5F6878]">{formatEuro(m.prezzoKg)}/kg</div> : null}
                      </>
                    ) : (
                      <div className="text-[14px] text-[#0E1B2C]">{m.costoMetro ? `${formatEuro(m.costoMetro)}${UNITA_LABEL[unita] ?? "/m"}` : "—"}</div>
                    )}
                  </div>
                  <MaterialiActions id={m.id} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
