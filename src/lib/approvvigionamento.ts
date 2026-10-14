// Approvvigionamento: quanto materiale DOUBLEU deve comprare per un ordine.
// Ogni scheda dà il suo fabbisogno netto (capi × consumo); per l'ordine i fabbisogni dello stesso
// materiale e colore si sommano, e solo sul totale si aggiungono scarto e arrotondamento:
// 4 referenze nello stesso jersey sono un solo acquisto, non quattro arrotondati.

import { calcolaAcquistoMateriale, calcolaCostoAlMetro, calcolaTotaleQuantita, type AcquistoMateriale, type MaterialeCostoInfo } from "@/lib/utils";
import { chiaveFornitore } from "@/lib/colori";

export interface MaterialeAcquisto extends MaterialeCostoInfo {
  id: string;
  nome: string;
  fornitore?: string | null;
  codice?: string | null;
}

/** Quello che serve di una scheda per calcolarne il fabbisogno. */
export interface SchedaAcquisto {
  id: string;
  codice: string;
  nomeArticolo: string;
  quantitaTaglia: Record<string, number> | null;
  consumoMateriale: { materialeId: string; consumoPerCapo: number }[] | null;
  tessutoPrincipale?: string | null;
  tessutoSecondario?: string | null;
  coloreBase?: string | null;
  coloreBaseCodice?: string | null;
  /** Capi della referenza nell'ordine, usati come stima quando la scheda non ha ancora le taglie. */
  capiOrdine?: number | null;
  /** Motivo per tenerla fuori dal conto anche se ha i dati (es. non è più nell'ordine). */
  esclusa?: string | null;
}

/** Capi della scheda: le sue taglie, o i capi dell'ordine come stima. */
export function capiAcquisto(s: SchedaAcquisto) {
  const proprie = calcolaTotaleQuantita(s.quantitaTaglia ?? {});
  if (proprie > 0) return { capi: proprie, stimati: false };
  return { capi: s.capiOrdine ?? 0, stimati: !!s.capiOrdine };
}

export interface Fabbisogno {
  materiale: MaterialeAcquisto;
  /** Colore DOUBLEU (es. "Navy") e codice colore del fornitore (es. "100"): solo per i tessuti della scheda. */
  colore: string | null;
  codiceColore: string | null;
  consumoPerCapo: number;
  /** Netto per l'ordine: metri per i tessuti, pezzi per i materiali a pezzo. */
  quantita: number;
}

/**
 * Fabbisogno netto di una scheda. Il colore si sa solo per il tessuto principale (colore base, col suo
 * codice fornitore) e per la costina (stesso colore base, il codice è del fornitore del principale).
 */
export function fabbisognoScheda(s: SchedaAcquisto, materiali: MaterialeAcquisto[]): Fabbisogno[] {
  const { capi } = capiAcquisto(s);
  if (!(capi > 0)) return [];
  return (s.consumoMateriale ?? []).flatMap((c) => {
    const materiale = materiali.find((m) => m.id === c.materialeId);
    if (!materiale || !(c.consumoPerCapo > 0)) return [];
    const principale = !!s.tessutoPrincipale && materiale.nome === s.tessutoPrincipale;
    const costina = !principale && !!s.tessutoSecondario && materiale.nome === s.tessutoSecondario;
    return [{
      materiale,
      colore: principale || costina ? s.coloreBase || null : null,
      codiceColore: principale ? s.coloreBaseCodice || null : null,
      consumoPerCapo: c.consumoPerCapo,
      quantita: capi * c.consumoPerCapo,
    }];
  });
}

/** Netto nell'unità d'acquisto (kg per i tessuti al kg) e il suo costo, senza scarto né arrotondamento. */
export function nettoMateriale(m: MaterialeAcquisto, quantita: number) {
  const a = calcolaAcquistoMateriale(m, quantita, 1);
  if (!a) return null;
  const prezzo = a.unita === "kg" ? m.prezzoKg : a.unita === "pz" ? m.costoMetro : calcolaCostoAlMetro(m);
  return { unita: a.unita, metri: a.metri, netto: a.netto, costo: prezzo ? a.netto * prezzo : null };
}

/** Una referenza dell'ordine con quello che consuma: la parte "dettaglio" del riepilogo. */
export interface DettaglioReferenza {
  id: string;
  codice: string;
  nomeArticolo: string;
  capi: number;
  /** Capi presi dall'ordine perché la scheda non ha ancora le taglie. */
  stimati: boolean;
  righe: (Fabbisogno & { netto: ReturnType<typeof nettoMateriale> })[];
}

export interface RigaAcquisto {
  materiale: MaterialeAcquisto;
  colore: string | null;
  codiceColore: string | null;
  /** Calcolo d'acquisto sul totale dell'ordine; null se mancano peso/altezza di un tessuto al kg. */
  acquisto: AcquistoMateriale | null;
  quantitaNetta: number;
  referenze: { id: string; codice: string; nomeArticolo: string }[];
}

export interface GruppoFornitore {
  fornitore: string; // "" = fornitore non indicato
  righe: RigaAcquisto[];
  stima: number;
  senzaPrezzo: number;
}

export interface RiepilogoAcquisti {
  fornitori: GruppoFornitore[];
  totale: number;
  senzaPrezzo: number;
  /** Schede dell'ordine che non entrano nel calcolo, col motivo. */
  escluse: { id: string; codice: string; nomeArticolo: string; motivo: string }[];
  referenze: DettaglioReferenza[];
}

export function riepilogoAcquisti(schede: SchedaAcquisto[], materiali: MaterialeAcquisto[]): RiepilogoAcquisti {
  const righe = new Map<string, RigaAcquisto>();
  const escluse: RiepilogoAcquisti["escluse"] = [];
  const referenze: DettaglioReferenza[] = [];
  for (const s of schede) {
    if (s.esclusa) {
      escluse.push({ id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo, motivo: s.esclusa });
      continue;
    }
    const f = fabbisognoScheda(s, materiali);
    const { capi, stimati } = capiAcquisto(s);
    if (f.length === 0) {
      const motivo = !(capi > 0) ? "mancano le quantità per taglia" : "manca il consumo dei materiali";
      escluse.push({ id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo, motivo });
      continue;
    }
    referenze.push({
      id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo, capi, stimati,
      righe: f.map((x) => ({ ...x, netto: nettoMateriale(x.materiale, x.quantita) })),
    });
    for (const x of f) {
      const k = [x.materiale.id, x.codiceColore ?? "", (x.colore ?? "").toLowerCase()].join("|");
      const r = righe.get(k) ?? { materiale: x.materiale, colore: x.colore, codiceColore: x.codiceColore, acquisto: null, quantitaNetta: 0, referenze: [] };
      r.quantitaNetta += x.quantita;
      if (!r.referenze.some((ref) => ref.id === s.id)) r.referenze.push({ id: s.id, codice: s.codice, nomeArticolo: s.nomeArticolo });
      righe.set(k, r);
    }
  }
  // Scarto e arrotondamento sul totale: capi = 1, "consumo" = netto dell'ordine.
  for (const r of righe.values()) r.acquisto = calcolaAcquistoMateriale(r.materiale, r.quantitaNetta, 1);

  const perFornitore = new Map<string, RigaAcquisto[]>();
  for (const r of righe.values()) {
    const f = chiaveFornitore(r.materiale.fornitore);
    perFornitore.set(f, [...(perFornitore.get(f) ?? []), r]);
  }
  const fornitori = [...perFornitore.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "it")))
    .map(([fornitore, rr]) => {
      const ordinate = rr.sort((a, b) => a.materiale.nome.localeCompare(b.materiale.nome, "it") || (a.colore ?? "").localeCompare(b.colore ?? "", "it"));
      return {
        fornitore,
        righe: ordinate,
        stima: ordinate.reduce((t, r) => t + (r.acquisto?.stima ?? 0), 0),
        senzaPrezzo: ordinate.filter((r) => r.acquisto?.stima == null).length,
      };
    });
  return {
    fornitori,
    totale: fornitori.reduce((t, g) => t + g.stima, 0),
    senzaPrezzo: fornitori.reduce((t, g) => t + g.senzaPrezzo, 0),
    escluse,
    referenze,
  };
}

/** "48 kg", "312 m", "250 pz" */
export const quantitaAcquisto = (a: AcquistoMateriale) => `${a.daComprare.toLocaleString("it-IT")} ${a.unita}`;
