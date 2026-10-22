import { prisma } from "@/lib/prisma";
import { ordiniOrderApp, type OrdineOrderApp } from "@/lib/orderApp";
import { riepilogoAcquisti, type MaterialeAcquisto, type SchedaAcquisto } from "@/lib/approvvigionamento";
import { statoReferenza } from "@/lib/referenze";
import { TIPI_COSTO_DB } from "@/lib/utils";
import { chiaveFornitore, etichettaColore, leggiNomiTessuto, type VoceColore } from "@/lib/colori";

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

type RigaScheda = {
  id: string; codice: string; nomeArticolo: string; quantitaTaglia: string | null; consumoMateriale: string | null;
  tessutoPrincipale: string | null; tessutoSecondario: string | null; coloreBase: string | null; coloreBaseCodice: string | null;
  articoloOrderAppId: string | null; firmaOrderApp: string | null; genere: string | null;
};

/** Scheda del database → dati per il calcolo acquisti: capi stimati dall'ordine, fuori se non è più nell'ordine. */
export function schedaAcquisto(s: RigaScheda, ordine: OrdineOrderApp | null | undefined): SchedaAcquisto {
  // Capi della parte della referenza che la scheda produce (adulto o bambino).
  const stato = statoReferenza(s, ordine?.referenze ?? null);
  return {
    id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo,
    quantitaTaglia: parseJson(s.quantitaTaglia, null),
    consumoMateriale: parseJson(s.consumoMateriale, null),
    tessutoPrincipale: s.tessutoPrincipale, tessutoSecondario: s.tessutoSecondario,
    coloreBase: s.coloreBase, coloreBaseCodice: s.coloreBaseCodice,
    ...(stato.tipo === "collegata" ? { capiOrdine: stato.referenza.capi }
      : stato.tipo === "non-piu-nell-ordine" ? { esclusa: "non è più nell'ordine" } : {}),
  };
}

/** Aggiunge alle righe il colore come lo legge il fornitore: "Navy · CTA col. 100 Blu scuro". */
export function etichettatoreColori(materiali: (MaterialeAcquisto & { coloriNomi?: string | null })[], voci: VoceColore[]) {
  const nomeFornitore = (materialeId: string, fornitore: string | null, codice: string | null) => {
    if (!codice) return null;
    const mat = materiali.find((m) => m.id === materialeId);
    return leggiNomiTessuto(mat?.coloriNomi)[codice]?.nome
      ?? voci.find((v) => v.fornitore === chiaveFornitore(fornitore) && v.codice === codice)?.nome ?? null;
  };
  return <T extends { materiale: { id: string; fornitore?: string | null }; colore: string | null; codiceColore: string | null }>(r: T) => ({
    ...r,
    coloreEtichetta: r.colore || r.codiceColore
      ? etichettaColore(r.colore, r.codiceColore, r.materiale.fornitore, nomeFornitore(r.materiale.id, r.materiale.fornitore ?? null, r.codiceColore))
      : null,
  });
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
  const riepilogo = riepilogoAcquisti(schedeRows.map((s) => schedaAcquisto(s, ordine)), materiali);
  const etichetta = etichettatoreColori(materiali, voci);
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
