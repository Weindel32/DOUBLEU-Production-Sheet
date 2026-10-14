import { prisma } from "@/lib/prisma";
import { ordiniOrderApp } from "@/lib/orderApp";
import { riepilogoAcquisti, type SchedaAcquisto } from "@/lib/approvvigionamento";
import { statoReferenza } from "@/lib/referenze";
import { TIPI_COSTO_DB } from "@/lib/utils";
import { chiaveFornitore, etichettaColore, leggiNomiTessuto } from "@/lib/colori";

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/** Tutto quello che serve per riepilogo e PDF d'acquisto di un ordine dell'Order App. */
export async function acquistiOrdine(ordineId: string) {
  const [schedeRows, materiali, voci, ordini] = await Promise.all([
    prisma.scheda.findMany({
      where: { ordineOrderAppId: ordineId, tipo: { notIn: TIPI_COSTO_DB } },
      orderBy: { codice: "asc" },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.materiale.findMany(),
    prisma.coloreFornitore.findMany(),
    ordiniOrderApp(),
  ]);
  const ordine = ordini.find((o) => o.id === ordineId) ?? null;
  const schede: SchedaAcquisto[] = schedeRows.map((s) => ({
    id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo,
    quantitaTaglia: parseJson(s.quantitaTaglia, null),
    consumoMateriale: parseJson(s.consumoMateriale, null),
    tessutoPrincipale: s.tessutoPrincipale, tessutoSecondario: s.tessutoSecondario,
    coloreBase: s.coloreBase, coloreBaseCodice: s.coloreBaseCodice,
    ...(() => {
      const stato = statoReferenza(s.articoloOrderAppId, ordine?.referenze ?? null);
      return stato.tipo === "collegata" ? { capiOrdine: stato.referenza.capi }
        : stato.tipo === "non-piu-nell-ordine" ? { esclusa: "non è più nell'ordine" } : {};
    })(),
  }));
  const riepilogo = riepilogoAcquisti(schede, materiali);

  // Il colore come lo legge il fornitore: "Navy · CTA col. 100 Blu scuro".
  const nomeFornitore = (materialeId: string, fornitore: string | null, codice: string | null) => {
    if (!codice) return null;
    const mat = materiali.find((m) => m.id === materialeId);
    return leggiNomiTessuto(mat?.coloriNomi)[codice]?.nome
      ?? voci.find((v) => v.fornitore === chiaveFornitore(fornitore) && v.codice === codice)?.nome ?? null;
  };
  const etichetta = <T extends { materiale: { id: string; fornitore?: string | null }; colore: string | null; codiceColore: string | null }>(r: T) => ({
    ...r,
    coloreEtichetta: r.colore || r.codiceColore
      ? etichettaColore(r.colore, r.codiceColore, r.materiale.fornitore, nomeFornitore(r.materiale.id, r.materiale.fornitore ?? null, r.codiceColore))
      : null,
  });
  const fornitori = riepilogo.fornitori.map((g) => ({ ...g, righe: g.righe.map(etichetta) }));
  const referenze = riepilogo.referenze.map((d) => ({ ...d, righe: d.righe.map(etichetta) }));

  return {
    ordineId,
    ordine,
    cliente: ordine?.cliente ?? schedeRows.find((s) => s.cliente)?.cliente?.nome ?? null,
    nSchede: schedeRows.length,
    riepilogo: { ...riepilogo, fornitori, referenze },
  };
}

export type AcquistiOrdine = Awaited<ReturnType<typeof acquistiOrdine>>;
