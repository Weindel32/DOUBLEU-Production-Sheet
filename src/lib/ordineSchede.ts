// Ordine delle schede dentro un ordine: prima quelle spostate a mano (priorità di produzione),
// poi le altre nell'ordine dell'Order App (kit come inseriti, poi gli articoli del kit; l'adulto prima del bambino).
// Vale solo nella Production Sheet: l'Order App non cambia.

import type { ReferenzaOrderApp } from "@/lib/orderApp";
import type { StatoReferenza } from "@/lib/referenze";

/** Posto della scheda nell'Order App; le schede non collegate vanno in fondo. */
export function chiaveOrderApp(stato: StatoReferenza, referenze: ReferenzaOrderApp[] | null | undefined): number {
  if (stato.tipo !== "collegata" || !referenze) return Number.MAX_SAFE_INTEGER;
  const i = referenze.findIndex((r) => r.id === stato.referenza.id);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i * 2 + (stato.parte === "bambino" ? 1 : 0);
}

export interface ChiaveScheda { posizione: number | null; orderApp: number; nome: string }

/** Spostate a mano per posizione, poi le altre per Order App, poi per nome. */
export function confrontaSchede(a: ChiaveScheda, b: ChiaveScheda): number {
  const pa = a.posizione ?? Number.MAX_SAFE_INTEGER;
  const pb = b.posizione ?? Number.MAX_SAFE_INTEGER;
  return pa - pb || a.orderApp - b.orderApp || a.nome.localeCompare(b.nome, "it", { numeric: true });
}

/**
 * Nuovo ordine dopo un trascinamento: `spostate` (nel nuovo ordine) prendono i posti che occupavano
 * in `attuale`; le altre restano dove sono. Così un elenco filtrato non scompiglia le schede nascoste.
 */
export function nuovoOrdine(attuale: string[], spostate: string[]): string[] {
  const presenti = new Set(attuale);
  const nuove = spostate.filter((id, i) => presenti.has(id) && spostate.indexOf(id) === i);
  const set = new Set(nuove);
  let k = 0;
  return attuale.map((id) => (set.has(id) ? nuove[k++] : id));
}
