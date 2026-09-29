export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import {
  formatData, STATI_SCHEDA, TIPI_SCHEDA, calcolaTotaleQuantita, calcolaRiepilogoCosti, formatEuro,
} from "@/lib/utils";
import SchedaRowMenu from "@/components/scheda/SchedaRowMenu";

type Filtri = { tipo?: string; stato?: string; margine?: string; q?: string };

const SOGLIA_MARGINE = 30;

function hrefFiltri(attuali: Filtri, cambio: Filtri): string {
  const next = { ...attuali, ...cambio };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return qs ? `/schede?${qs}` : "/schede";
}

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export default async function SchedePage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filtri: Filtri = { tipo: str("tipo"), stato: str("stato"), margine: str("margine"), q: str("q") };

  const [schede, materiali] = await Promise.all([
    prisma.scheda.findMany({ orderBy: { updatedAt: "desc" }, include: { cliente: true } }),
    prisma.materiale.findMany(),
  ]);

  const righe = schede.map((s) => {
    const lavSplit = [s.costoTaglio, s.costoCucitura, s.costoStampa, s.costoRicamo];
    const costi = calcolaRiepilogoCosti(
      {
        consumi: parseJson(s.consumoMateriale, []),
        accessori: parseJson(s.accessori, []),
        // Schede vecchie: solo il totale lavorazione, senza il dettaglio per voce.
        lavorazioni: lavSplit.some((v) => v !== null) ? lavSplit : [s.costoLavorazione],
        prezzoVendita: s.prezzoVendita,
      },
      materiali,
    );
    const immagini = parseJson<string[]>(s.immagini, []);
    const pezzi = calcolaTotaleQuantita(parseJson<Record<string, number>>(s.quantitaTaglia, {}));
    return { s, costi, copertina: immagini[0], pezzi };
  });

  const q = filtri.q?.trim().toLowerCase();
  const filtrate = righe.filter(({ s, costi }) =>
    (!filtri.tipo || s.tipo === filtri.tipo) &&
    (!filtri.stato || s.stato === filtri.stato) &&
    (filtri.margine !== "basso" || (costi.margine !== null && costi.margine < SOGLIA_MARGINE)) &&
    (!q || [s.codice, s.nomeArticolo, s.cliente?.nome, s.categoria, s.collezione].some((v) => v?.toLowerCase().includes(q))),
  );

  const nPreventivi = schede.filter((s) => s.tipo === "preventivo").length;
  const nOrdini = schede.length - nPreventivi;

  const chip = (label: string, cambio: Filtri, attivo: boolean) => (
    <Link key={label} href={hrefFiltri(filtri, cambio)} aria-current={attivo ? "true" : undefined}
      className={`h-10 px-4 rounded-full border text-sm inline-flex items-center whitespace-nowrap transition-colors ${attivo ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
      {label}
    </Link>
  );

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">Schede</h1>
          <p className="text-sm text-[#5F6878] mt-1">
            {schede.length} {schede.length === 1 ? "scheda" : "schede"} · {nPreventivi} {nPreventivi === 1 ? "preventivo" : "preventivi"} di costo · {nOrdini} {nOrdini === 1 ? "ordine" : "ordini"}
          </p>
        </div>
        <form action="/schede" className="w-full sm:w-80">
          {filtri.tipo && <input type="hidden" name="tipo" value={filtri.tipo} />}
          {filtri.stato && <input type="hidden" name="stato" value={filtri.stato} />}
          {filtri.margine && <input type="hidden" name="margine" value={filtri.margine} />}
          <label className="h-12 border border-[#D6D1C4] rounded-xl bg-white flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
            <Search size={18} />
            <input type="search" name="q" defaultValue={filtri.q} placeholder="Cerca codice, articolo, cliente" aria-label="Cerca schede"
              className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-[15px]" />
          </label>
        </form>
        <Link href="/schede/nuova"
          className="h-12 px-5 rounded-xl bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-[15px] font-semibold inline-flex items-center gap-2">
          <Plus size={18} /> Nuova scheda
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip("Tutte", { tipo: undefined }, !filtri.tipo)}
        {TIPI_SCHEDA.map((t) => chip(t.value === "preventivo" ? "Preventivi di costo" : "Ordini", { tipo: t.value }, filtri.tipo === t.value))}
        <span className="w-px h-6 bg-[#D6D1C4] mx-1" aria-hidden />
        {STATI_SCHEDA.map((st) => chip(st.label, { stato: filtri.stato === st.value ? undefined : st.value }, filtri.stato === st.value))}
        {chip(`Margine sotto ${SOGLIA_MARGINE}%`, { margine: filtri.margine === "basso" ? undefined : "basso" }, filtri.margine === "basso")}
      </div>

      {filtrate.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-16 px-6">
          <FileText size={44} className="mx-auto mb-4 text-[#5F6878]" />
          <h2 className="font-display text-lg font-bold text-[#0E1B2C] mb-1">
            {schede.length === 0 ? "Nessuna scheda" : "Nessuna scheda con questi filtri"}
          </h2>
          <p className="text-[#5F6878] text-sm mb-5">
            {schede.length === 0 ? "Crea il primo preventivo di costo o ordine di produzione." : "Togli qualche filtro o cambia ricerca."}
          </p>
          {schede.length === 0
            ? <Link href="/schede/nuova" className="h-11 px-5 rounded-xl bg-[#0E1B2C] text-white text-sm font-semibold inline-flex items-center gap-2"><Plus size={16} /> Nuova scheda</Link>
            : <Link href="/schede" className="h-11 px-5 rounded-xl border border-[#D6D1C4] text-[#0E1B2C] text-sm font-medium inline-flex items-center">Mostra tutte</Link>}
        </div>
      ) : (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl overflow-x-auto">
          <table className="w-full text-[15px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E4E0D6] text-left">
                <th className="pl-4 pr-2 py-3 w-[72px]"><span className="sr-only">Foto</span></th>
                <th className="px-3 py-3">Codice</th>
                <th className="px-3 py-3">Articolo</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3 text-right">Costo</th>
                <th className="px-3 py-3 text-right">Prezzo</th>
                <th className="px-3 py-3 text-right">Margine</th>
                <th className="px-3 py-3">Stato</th>
                <th className="px-3 py-3 w-12"><span className="sr-only">Azioni</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrate.map(({ s, costi, copertina, pezzi }) => {
                const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
                const tipo = TIPI_SCHEDA.find((t) => t.value === s.tipo) ?? TIPI_SCHEDA[1];
                const dettagli = [s.categoria, s.genere, pezzi > 0 && s.tipo !== "preventivo" ? `${pezzi} pz` : null].filter(Boolean).join(" · ");
                const margineCls = costi.margine === null ? "text-[#5F6878]" : costi.margine < SOGLIA_MARGINE ? "text-[#A8461F]" : "text-[#1D6B4A]";
                return (
                  <tr key={s.id} className="border-b border-[#EFEBE2] last:border-0">
                    <td className="pl-4 pr-2 py-2.5">
                      <Link href={`/schede/${s.id}`} tabIndex={-1} aria-hidden className="block w-14 h-14 rounded-[10px] bg-[#EEEBE3] overflow-hidden">
                        {copertina && <img src={copertina} alt="" className="w-full h-full object-cover" />}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm text-[#0E1B2C] whitespace-nowrap">{s.codice}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/schede/${s.id}`} className="font-semibold text-[#0E1B2C] hover:text-[#1F3A68] hover:underline underline-offset-2">
                        {s.nomeArticolo}
                      </Link>
                      {dettagli && <div className="text-[13px] text-[#5F6878]">{dettagli}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[#4A5566]">{s.cliente?.nome || "—"}</td>
                    <td className="px-3 py-2.5"><span className={`badge badge-${tipo.value}`}>{tipo.breve}</span></td>
                    <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">{costi.totale > 0 ? formatEuro(costi.totale) : "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">{costi.prezzoVendita > 0 ? formatEuro(costi.prezzoVendita) : "—"}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-semibold whitespace-nowrap ${margineCls}`}>
                      {costi.margine === null ? "—" : `${costi.margine.toFixed(1).replace(".", ",")}%`}
                    </td>
                    <td className="px-3 py-2.5">
                      {stato && <span className={`badge badge-${s.stato}`}>{stato.label}</span>}
                      <div className="text-xs text-[#5F6878] mt-1">{formatData(s.updatedAt)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <SchedaRowMenu id={s.id} nome={s.nomeArticolo} statoCorrente={s.stato} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
