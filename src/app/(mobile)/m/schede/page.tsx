export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, ChevronDown, Shirt, ShoppingCart } from "lucide-react";
import { formatData, STATI_SCHEDA, TIPI_COSTO_DB, statoOrdine } from "@/lib/utils";
import { ordiniOrderApp, type OrdineOrderApp } from "@/lib/orderApp";
import { capiScheda, statoReferenza } from "@/lib/referenze";
import Testata from "@/components/mobile/Testata";

type Filtro = "tutte" | "esecutiva" | "bozza";

/** Schede di produzione dal telefono, raggruppate per ordine come su desktop: consultazione e acquisti. */
export default async function MobileSchedePage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const filtro: Filtro = sp.stato === "bozza" || sp.stato === "esecutiva" ? sp.stato : "tutte";
  const [tutte, ordini] = await Promise.all([
    prisma.scheda.findMany({
      where: { tipo: { notIn: TIPI_COSTO_DB } },
      include: { cliente: true },
      orderBy: { updatedAt: "desc" },
    }),
    ordiniOrderApp(),
  ]);
  const ordineDi = new Map(ordini.map((o) => [o.id, o]));
  const schede = filtro === "tutte" ? tutte : tutte.filter((s) => s.stato === filtro);
  const conta = (f: Filtro) => (f === "tutte" ? tutte.length : tutte.filter((s) => s.stato === f).length);

  // Un blocco per ordine; le schede senza ordine per club. In cima l'ultimo toccato.
  type Riga = (typeof schede)[number] & { pezzi: number; stimati: boolean; orfana: boolean };
  const blocchi = new Map<string, { ordine?: OrdineOrderApp; ordineId?: string; cliente: string | null; righe: Riga[] }>();
  for (const s of schede) {
    const ordine = s.ordineOrderAppId ? ordineDi.get(s.ordineOrderAppId) : undefined;
    const ref = statoReferenza(s.articoloOrderAppId, ordine?.referenze ?? null);
    const { capi, stimati } = capiScheda(s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {}, ref.tipo === "collegata" ? ref.referenza : null);
    const k = s.ordineOrderAppId ? `o:${s.ordineOrderAppId}` : `c:${s.clienteId ?? ""}`;
    const b = blocchi.get(k) ?? { ordine, ordineId: s.ordineOrderAppId ?? undefined, cliente: ordine?.cliente ?? s.cliente?.nome ?? null, righe: [] };
    b.righe.push({ ...s, pezzi: capi, stimati, orfana: ref.tipo === "non-piu-nell-ordine" });
    blocchi.set(k, b);
  }
  const elenco = [...blocchi.values()];
  const FILTRI: { value: Filtro; label: string }[] = [
    { value: "tutte", label: "Tutte" },
    ...STATI_SCHEDA.slice().reverse().map((s) => ({ value: s.value as Filtro, label: s.value === "esecutiva" ? "Esecutive" : "Bozze" })),
  ];

  return (
    <>
      <Testata indietro="/m" sopra="Double U" titolo="Ordini e schede" />
      <div className="px-4 space-y-3">
        <div role="group" aria-label="Stato" className="flex bg-[#EEEBE3] rounded-xl p-1">
          {FILTRI.map((f) => {
            const on = f.value === filtro;
            return (
              <Link key={f.value} href={f.value === "tutte" ? "/m/schede" : `/m/schede?stato=${f.value}`} aria-current={on ? "true" : undefined}
                className={`flex-1 h-11 rounded-lg flex items-center justify-center gap-1.5 text-[15px] ${on ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
                {f.label} <span className="text-xs text-[#5F6878] font-normal">{conta(f.value)}</span>
              </Link>
            );
          })}
        </div>

        {elenco.length === 0 && (
          <p className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">Nessuna scheda.</p>
        )}

        {elenco.map((b, i) => {
          const valide = b.righe.filter((r) => !r.orfana);
          const pezzi = valide.reduce((t, r) => t + r.pezzi, 0);
          const stimati = valide.some((r) => r.stimati);
          return (
            <details key={b.ordineId ?? `c:${b.cliente}`} open={i === 0 && elenco.length <= 3} className="group bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 px-4 py-3.5 active:bg-[#FBFAF7]">
                <span className="flex-1 min-w-0">
                  <span className={`block font-display font-bold text-[17px] truncate ${b.cliente ? "text-[#1F3A68]" : "text-[#5F6878]"}`}>{b.cliente ?? "Senza cliente"}</span>
                  <span className="block text-[13px] text-[#5F6878] truncate">
                    {b.ordineId ? <><span className="font-mono">{b.ordineId}</span>{b.ordine?.stato && ` · ${statoOrdine(b.ordine.stato)}`}</> : "Senza ordine collegato"}
                  </span>
                  <span className="block text-[13px] text-[#0E1B2C] mt-0.5">
                    {valide.length}{b.ordine?.referenze.length ? ` su ${b.ordine.referenze.length}` : ""} {valide.length === 1 && !b.ordine ? "referenza" : "referenze"}
                    {pezzi > 0 && ` · ${pezzi} pz${stimati ? " (stima)" : ""}`}
                  </span>
                </span>
                <ChevronDown size={20} className="text-[#5F6878] transition-transform group-open:rotate-180 flex-shrink-0" />
              </summary>

              <ul className="border-t border-[#EFEBE2]">
                {b.righe.map((s) => {
                  const immagini: string[] = s.immagini ? JSON.parse(s.immagini) : [];
                  return (
                    <li key={s.id} className="border-b border-[#EFEBE2] last:border-0">
                      <Link href={`/m/schede/${s.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-[#FBFAF7]">
                        <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {immagini[0] ? <img src={immagini[0]} alt="" className="w-full h-full object-cover" /> : <Shirt size={20} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold truncate">{s.nomeArticolo}</span>
                          <span className="block text-[13px] text-[#5F6878] truncate">
                            <span className="font-mono">{s.codiceModello || s.codice}</span>
                            {s.pezzi > 0 && ` · ${s.pezzi} pz${s.stimati ? " stimati" : ""}`}
                            {s.stato === "bozza" && " · bozza"}
                          </span>
                          {s.orfana && <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FBEDE5] text-[#A8461F]">Non più nell&apos;ordine</span>}
                        </span>
                        <span className="text-xs text-[#5F6878] flex-shrink-0">{formatData(s.updatedAt.toISOString())}</span>
                        <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {b.ordineId && (
                <div className="p-3 border-t border-[#EFEBE2] bg-[#FBFAF7]">
                  <Link href={`/m/acquisti/${encodeURIComponent(b.ordineId)}`}
                    className="h-12 rounded-xl bg-[#0E1B2C] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:bg-[#1F3A68]">
                    <ShoppingCart size={18} /> Da acquistare
                  </Link>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </>
  );
}
