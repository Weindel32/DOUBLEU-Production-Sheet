// Consuntivo di un ordine: spese reali per fase contro il costo previsto dalle schede.
// Le spese stanno sull'ordine, non sulla referenza: una fattura di jersey copre più articoli.
// Il previsto è costo per capo della scheda × capi, diviso nelle stesse fasi delle spese.

import type { RiepilogoCosti } from "@/lib/utils";

export const FASI_SPESA = ["Cartamodello", "Tessuto", "Accessori", "Taglio", "Confezione", "Stampa", "Ricamo", "Trasporti", "Altro"] as const;
export type FaseSpesa = typeof FASI_SPESA[number];

export interface Spesa {
  id: string;
  data: string;
  fase: string;
  fornitore: string | null;
  descrizione: string | null;
  /** Costo reale: imponibile se c'è fattura, importo pagato se non c'è. */
  importo: number;
  fattura: boolean;
  iva: number | null;
  riferimento: string | null;
  /** Solo Tessuto, facoltativa. */
  quantita: number | null;
  unita: string | null;
}

/** Quello che serve di una scheda d'ordine per il previsto. */
export interface SchedaPrevisto {
  capi: number;
  costi: RiepilogoCosti;
  costoTaglio: number | null;
  costoCucitura: number | null;
  costoStampa: number | null;
  costoRicamo: number | null;
  costoLavorazione: number | null;
}

/** Costo per capo della scheda diviso per fase. Schede vecchie con il solo totale lavorazione: va in Confezione. */
export function previstoPerCapo(s: SchedaPrevisto): Record<FaseSpesa, number> {
  const dettaglio = [s.costoTaglio, s.costoCucitura, s.costoStampa, s.costoRicamo].some((v) => v !== null);
  return {
    // Il cartamodello è un costo di sviluppo (campioni), non sta nel costo per capo: nessun previsto.
    Cartamodello: 0,
    Tessuto: s.costi.materiali,
    Accessori: s.costi.accessori,
    Taglio: s.costoTaglio ?? 0,
    Confezione: dettaglio ? s.costoCucitura ?? 0 : s.costoLavorazione ?? 0,
    Stampa: s.costoStampa ?? 0,
    Ricamo: s.costoRicamo ?? 0,
    Trasporti: 0,
    Altro: 0,
  };
}

export interface RigaConsuntivo { fase: FaseSpesa; previsto: number; speso: number; nSpese: number }

/**
 * Consuntivo aperto: le fasi senza spese contano al previsto, così una fattura non ancora arrivata
 * non sembra un risparmio. Chiuso: conta solo lo speso.
 */
export function riepilogoConsuntivo(schede: SchedaPrevisto[], spese: Spesa[], chiuso: boolean) {
  const righe: RigaConsuntivo[] = FASI_SPESA.map((fase) => ({ fase, previsto: 0, speso: 0, nSpese: 0 }));
  const riga = (fase: string) => righe.find((r) => r.fase === fase) ?? righe[righe.length - 1];

  let capi = 0, ricavo = 0, senzaPrezzo = 0;
  for (const s of schede) {
    if (!(s.capi > 0)) continue;
    capi += s.capi;
    if (s.costi.prezzoVendita > 0) ricavo += s.costi.prezzoVendita * s.capi;
    else senzaPrezzo++;
    const perCapo = previstoPerCapo(s);
    for (const f of FASI_SPESA) riga(f).previsto += perCapo[f] * s.capi;
  }
  let conFattura = 0, senzaFattura = 0;
  for (const sp of spese) {
    const r = riga(sp.fase);
    r.speso += sp.importo;
    r.nSpese++;
    if (sp.fattura) conFattura += sp.importo; else senzaFattura += sp.importo;
  }

  const previsto = righe.reduce((t, r) => t + r.previsto, 0);
  const speso = conFattura + senzaFattura;
  const costo = chiuso ? speso : righe.reduce((t, r) => t + (r.nSpese > 0 ? r.speso : r.previsto), 0);
  const margine = (costo: number) => (ricavo > 0 && costo > 0 ? ((ricavo - costo) / ricavo) * 100 : null);
  return {
    righe,
    capi,
    ricavo,
    /** Schede con capi ma senza prezzo di vendita: il ricavo è incompleto. */
    senzaPrezzo,
    previsto,
    speso,
    conFattura,
    senzaFattura,
    /** Costo reale dell'ordine; a consuntivo aperto, con il previsto per le fasi ancora senza spese. */
    costo,
    /** Positivo = costo reale sotto il previsto. */
    risparmio: previsto - costo,
    marginePrevisto: margine(previsto),
    margineReale: margine(costo),
  };
}

export type RiepilogoConsuntivo = ReturnType<typeof riepilogoConsuntivo>;

/** Fabbisogno di tessuto dell'ordine in un'unità d'acquisto, dall'approvvigionamento. */
export interface FabbisognoTessuto {
  unita: "kg" | "m";
  /** Netto: capi × consumo. */
  netto: number;
  /** Con scarto e arrotondamento: quello che si prevedeva di comprare. */
  daComprare: number;
  /** Spesa a listino e quantità su cui è calcolata (solo righe con prezzo). */
  listino: number;
  quantitaListino: number;
}

/**
 * Tessuto comprato contro previsto, per unità (kg o m), solo dalle spese con la quantità:
 * senza quantità non c'è confronto e il resto del consuntivo non cambia.
 */
export function confrontoTessuto(spese: Spesa[], fabbisogno: FabbisognoTessuto[]) {
  const tessuto = spese.filter((s) => s.fase === "Tessuto");
  return (["kg", "m"] as const).flatMap((unita) => {
    const conQuantita = tessuto.filter((s) => s.quantita && s.unita === unita);
    if (conQuantita.length === 0) return [];
    const comprato = conQuantita.reduce((t, s) => t + s.quantita!, 0);
    const pagato = conQuantita.reduce((t, s) => t + s.importo, 0);
    const f = fabbisogno.find((x) => x.unita === unita) ?? null;
    return [{
      unita,
      comprato,
      prezzoMedio: pagato / comprato,
      netto: f?.netto ?? null,
      daComprare: f?.daComprare ?? null,
      prezzoListino: f && f.quantitaListino > 0 ? f.listino / f.quantitaListino : null,
      nSpese: conQuantita.length,
    }];
  });
}
