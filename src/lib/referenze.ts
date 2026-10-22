// Scheda ↔ referenza dell'ordine nell'Order App: a quale articolo è collegata, se c'è ancora,
// e quanti capi usare per costi e acquisti quando le taglie non sono ancora arrivate.
// Adulto e bambino della stessa referenza sono due prodotti (due codici, due cartamodelli):
// la scheda Junior prende le taglie bambino, le altre le taglie adulto.

import { calcolaTotaleQuantita } from "@/lib/utils";
import { nomeReferenza, sommaTaglie, trovaReferenza, type ReferenzaOrderApp } from "@/lib/orderApp";

export type Parte = "adulto" | "bambino";

/** La parte della referenza che la scheda produce: Junior è il genere dei modelli Kids. */
export const parteScheda = (genere: string | null | undefined): Parte => (genere === "Junior" ? "bambino" : "adulto");

export const ETICHETTA_PARTE: Record<Parte, string> = { adulto: "Adulto", bambino: "Bambino" };

/**
 * Parti della referenza che servono in produzione: bambino solo se ci sono taglie bambino.
 * Finché le taglie non arrivano c'è solo l'adulto, che porta la stima dei capi.
 */
export function partiReferenza(r: ReferenzaOrderApp): Parte[] {
  if (!r.taglieAdulto && !r.taglieBambino) return ["adulto"];
  return [...(r.taglieAdulto ? ["adulto" as const] : []), ...(r.taglieBambino ? ["bambino" as const] : [])];
}

/** La referenza vista da una scheda: taglie e capi sono solo quelli della sua parte. */
export function quotaReferenza(r: ReferenzaOrderApp, parte: Parte): ReferenzaOrderApp {
  if (parte === "adulto" && !r.taglie) return r;
  const taglie = parte === "bambino" ? r.taglieBambino : r.taglieAdulto;
  return { ...r, taglie, capi: sommaTaglie(taglie) || null };
}

/** Chiave di una parte di referenza coperta da una scheda: articolo (uno qualsiasi della referenza) e parte. */
export const chiaveParte = (articoloId: string, parte: Parte) => `${articoloId}:${parte}`;

/** La referenza e la parte sono coperte da una delle schede (chiavi `chiaveParte`)? */
export const parteCoperta = (r: ReferenzaOrderApp, parte: Parte, chiavi: Iterable<string>) => {
  const set = new Set(chiavi);
  return r.ids.some((id) => set.has(chiaveParte(id, parte)));
};

export type StatoReferenza =
  /** Nessun ordine, oppure ordine non leggibile ora (Order App irraggiungibile): niente da dire. */
  | { tipo: "nessuno" }
  | { tipo: "da-collegare" }
  | { tipo: "non-piu-nell-ordine" }
  /** `ricollegata`: l'id dell'articolo era cambiato, ritrovato per kit, descrizione e colore: va salvato. */
  | { tipo: "collegata"; referenza: ReferenzaOrderApp; parte: Parte; ricollegata?: string };

type SchedaReferenza = { articoloOrderAppId: string | null | undefined; firmaOrderApp?: string | null; genere?: string | null };

/**
 * `referenze` null = ordine non letto: non si segnala nulla, per non dare falsi "non più nell'ordine".
 * Se l'id dell'articolo non c'è più ma un articolo dell'ordine ha la stessa firma, la scheda resta collegata.
 */
export function statoReferenza(scheda: SchedaReferenza, referenze: ReferenzaOrderApp[] | null): StatoReferenza {
  if (!referenze) return { tipo: "nessuno" };
  if (!scheda.articoloOrderAppId) return { tipo: "da-collegare" };
  const parte = parteScheda(scheda.genere);
  const referenza = trovaReferenza(referenze, scheda.articoloOrderAppId);
  if (referenza) return { tipo: "collegata", referenza: quotaReferenza(referenza, parte), parte };
  const firma = scheda.firmaOrderApp;
  const perFirma = firma ? referenze.filter((r) => r.firme.includes(firma)) : [];
  if (perFirma.length === 1) {
    const r = perFirma[0];
    return { tipo: "collegata", referenza: quotaReferenza(r, parte), parte, ricollegata: r.ids[r.firme.indexOf(firma!)] };
  }
  return { tipo: "non-piu-nell-ordine" };
}

/** Firma dell'articolo `articoloId` dentro le referenze dell'ordine (per salvarla insieme al collegamento). */
export function firmaDi(referenze: ReferenzaOrderApp[], articoloId: string | null | undefined) {
  const r = trovaReferenza(referenze, articoloId);
  return r ? r.firme[r.ids.indexOf(articoloId!)] ?? null : null;
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/**
 * Referenza più probabile per una scheda ancora da collegare: stesso nome, altrimenti l'unica della stessa
 * categoria. Si escludono quelle già prese da altre schede. Solo un suggerimento: conferma l'utente.
 */
export function suggerisciReferenza(
  scheda: { nomeArticolo: string; categoria?: string | null; genere?: string | null },
  referenze: ReferenzaOrderApp[],
  giaCollegate: Iterable<string> = [],
) {
  const parte = parteScheda(scheda.genere);
  const libere = referenze.filter((r) => partiReferenza(r).includes(parte) && !parteCoperta(r, parte, giaCollegate));
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
