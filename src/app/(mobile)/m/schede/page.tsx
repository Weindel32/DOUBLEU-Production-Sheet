export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatData, TIPI_COSTO_DB, statoOrdine } from "@/lib/utils";
import { ordiniOrderApp } from "@/lib/orderApp";
import { capiScheda, partiReferenza, statoReferenza } from "@/lib/referenze";
import Testata from "@/components/mobile/Testata";
import MemoriaElenco from "@/components/ui/MemoriaElenco";
import ElencoOrdini, { type BloccoOrdine, type RigaOrdine } from "@/components/mobile/ElencoOrdini";
import { chiaveOrderApp, confrontaSchede } from "@/lib/ordineSchede";

/** Schede di produzione dal telefono, raggruppate per ordine come su desktop: consultazione e acquisti. */
export default async function MobileSchedePage() {
  const [schede, ordini] = await Promise.all([
    prisma.scheda.findMany({
      where: { tipo: { notIn: TIPI_COSTO_DB } },
      include: { cliente: true },
      orderBy: { updatedAt: "desc" },
    }),
    ordiniOrderApp(),
  ]);
  const ordineDi = new Map(ordini.map((o) => [o.id, o]));

  // Dentro un ordine lo stesso ordine del computer: priorità scelta a mano, altrimenti l'Order App.
  // I blocchi restano nell'ordine di prima (ultima scheda modificata); da qui non si sposta niente.
  const primo = new Map<string, number>();
  schede.forEach((s, i) => { const k = s.ordineOrderAppId ?? `c:${s.clienteId ?? ""}`; if (!primo.has(k)) primo.set(k, i); });
  const chiave = (s: (typeof schede)[number]) => {
    const referenze = s.ordineOrderAppId ? ordineDi.get(s.ordineOrderAppId)?.referenze : undefined;
    return { posizione: s.posizione, orderApp: chiaveOrderApp(statoReferenza(s, referenze ?? null), referenze), nome: s.nomeArticolo };
  };
  const indice = new Map(schede.map((s, i) => [s.id, i]));
  schede.sort((a, b) => {
    const ka = a.ordineOrderAppId ?? `c:${a.clienteId ?? ""}`, kb = b.ordineOrderAppId ?? `c:${b.clienteId ?? ""}`;
    if (ka !== kb) return primo.get(ka)! - primo.get(kb)!;
    return a.ordineOrderAppId ? confrontaSchede(chiave(a), chiave(b)) : indice.get(a.id)! - indice.get(b.id)!;
  });

  // Tutte le schede arrivano al telefono già contate: il filtro di stato lo applica l'elenco, senza tornare qui.
  const blocchi = new Map<string, BloccoOrdine>();
  const righe: RigaOrdine[] = schede.map((s) => {
    const ordine = s.ordineOrderAppId ? ordineDi.get(s.ordineOrderAppId) : undefined;
    const ref = statoReferenza(s, ordine?.referenze ?? null);
    const { capi, stimati } = capiScheda(s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {}, ref.tipo === "collegata" ? ref.referenza : null);
    const chiave = s.ordineOrderAppId ? `o:${s.ordineOrderAppId}` : `c:${s.clienteId ?? ""}`;
    if (!blocchi.has(chiave)) blocchi.set(chiave, {
      chiave,
      ordineId: s.ordineOrderAppId ?? null,
      cliente: ordine?.cliente ?? s.cliente?.nome ?? null,
      statoOrdine: statoOrdine(ordine?.stato),
      trovato: !!ordine,
      // I capi comprati già fatti (LS24) non chiedono una scheda.
      parti: ordine?.referenze.length ? ordine.referenze.reduce((t, r) => t + (r.acquistato ? 0 : partiReferenza(r).length), 0) : null,
    });
    const immagini: string[] = s.immagini ? JSON.parse(s.immagini) : [];
    return {
      id: s.id, blocco: chiave, nome: s.nomeArticolo, codice: s.codiceModello || s.codice, stato: s.stato, fasi: s.fasi,
      pezzi: capi, stimati, orfana: ref.tipo === "non-piu-nell-ordine", foto: immagini[0] ?? null,
      aggiornata: formatData(s.updatedAt.toISOString()),
    };
  });

  return (
    <>
      <MemoriaElenco base="/m/schede" />
      <Testata indietro="/m" sopra="Double U" titolo="Ordini e schede" />
      <ElencoOrdini righe={righe} blocchi={[...blocchi.values()]} />
    </>
  );
}
