// Scheda ↔ referenza dell'ordine nell'Order App: a quale articolo è collegata, se c'è ancora,
// e quanti capi usare per costi e acquisti quando le taglie non sono ancora arrivate.

import { calcolaTotaleQuantita } from "@/lib/utils";
import { nomeReferenza, trovaReferenza, type ReferenzaOrderApp } from "@/lib/orderApp";

export type StatoReferenza =
  /** Nessun ordine, oppure ordine non leggibile ora (Order App irraggiungibile): niente da dire. */
  | { tipo: "nessuno" }
  | { tipo: "da-collegare" }
  | { tipo: "non-piu-nell-ordine" }
  | { tipo: "collegata"; referenza: ReferenzaOrderApp };

/** `referenze` null = ordine non letto: non si segnala nulla, per non dare falsi "non più nell'ordine". */
export function statoReferenza(articoloId: string | null | undefined, referenze: ReferenzaOrderApp[] | null): StatoReferenza {
  if (!referenze) return { tipo: "nessuno" };
  if (!articoloId) return { tipo: "da-collegare" };
  const referenza = trovaReferenza(referenze, articoloId);
  return referenza ? { tipo: "collegata", referenza } : { tipo: "non-piu-nell-ordine" };
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/**
 * Referenza più probabile per una scheda ancora da collegare: stesso nome, altrimenti l'unica della stessa
 * categoria. Si escludono quelle già prese da altre schede. Solo un suggerimento: conferma l'utente.
 */
export function suggerisciReferenza(
  scheda: { nomeArticolo: string; categoria?: string | null },
  referenze: ReferenzaOrderApp[],
  giaCollegate: Set<string> = new Set(),
) {
  const libere = referenze.filter((r) => !r.ids.some((id) => giaCollegate.has(id)));
  const perNome = libere.find((r) => norm(nomeReferenza(r)) === norm(scheda.nomeArticolo));
  if (perNome) return perNome;
  const perCategoria = libere.filter((r) => scheda.categoria && norm(r.categoria) === norm(scheda.categoria));
  return perCategoria.length === 1 ? perCategoria[0] : undefined;
}

/**
 * Capi su cui calcolare costi e acquisti: le taglie della scheda se ci sono; altrimenti i capi della
 * referenza nell'ordine, come stima finché il club non manda le taglie.
 */
export function capiScheda(quantitaTaglia: Record<string, number> | null | undefined, referenza?: ReferenzaOrderApp | null) {
  const proprie = calcolaTotaleQuantita(quantitaTaglia ?? {});
  if (proprie > 0) return { capi: proprie, stimati: false };
  return { capi: referenza?.capi ?? 0, stimati: !!referenza?.capi };
}

/** Le taglie dell'ordine differiscono da quelle della scheda? (per proporre "Usa le taglie dell'ordine") */
export function taglieDiverse(scheda: Record<string, number> | null | undefined, ordine: Record<string, number> | null) {
  if (!ordine) return false;
  const chiavi = new Set([...Object.keys(scheda ?? {}), ...Object.keys(ordine)]);
  return [...chiavi].some((t) => (scheda?.[t] ?? 0) !== (ordine[t] ?? 0));
}

export const testoTaglie = (t: Record<string, number>) =>
  Object.entries(t).filter(([, q]) => q > 0).map(([k, q]) => `${k} ${q}`).join(" · ");
