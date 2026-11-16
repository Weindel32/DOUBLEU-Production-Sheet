// Consuntivo di un ordine: spese reali per fase contro il costo previsto dalle schede.
// Le spese stanno sull'ordine, non sulla referenza: una fattura di jersey copre più articoli.
// Il previsto è costo per capo della scheda × capi, diviso nelle stesse fasi delle spese.

import type { RiepilogoCosti } from "@/lib/utils";
import type { VenditaOrdine } from "@/lib/orderApp";
import type { Parte } from "@/lib/referenze";

/**
 * "Cartamodello" è la stampa del piazzato: costo dell'ordine. "Sviluppo taglie" (taglie nuove, modelli nuovi)
 * è un investimento che resta: fuori dal margine operativo, dentro il margine dopo sviluppo.
 */
export const FASI_SPESA = ["Sviluppo taglie", "Tessuto", "Accessori", "Cartamodello", "Taglio", "Confezione", "Stampa", "Ricamo", "Trasporti", "Altro"] as const;
export type FaseSpesa = typeof FASI_SPESA[number];
export const FASE_SVILUPPO: FaseSpesa = "Sviluppo taglie";

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
    // Sviluppo e stampa del piazzato (cartamodello) non stanno nel costo per capo: nessun previsto, conta lo speso.
    "Sviluppo taglie": 0,
    Tessuto: s.costi.materiali,
    Accessori: s.costi.accessori,
    Cartamodello: 0,
    Taglio: s.costoTaglio ?? 0,
    Confezione: dettaglio ? s.costoCucitura ?? 0 : s.costoLavorazione ?? 0,
    Stampa: s.costoStampa ?? 0,
    Ricamo: s.costoRicamo ?? 0,
    Trasporti: 0,
    Altro: 0,
  };
}

export interface RigaConsuntivo {
  fase: FaseSpesa; previsto: number; speso: number; nSpese: number;
  /** Segnata completa: tutte le spese della fase sono registrate. */
  completa: boolean;
  /** Quanto conta nel costo reale: lo speso se completa (o consuntivo chiuso), altrimenti il più alto tra speso e previsto. */
  costo: number;
}

/**
 * Consuntivo aperto: ogni fase conta il più alto tra speso e previsto, così una fattura non ancora arrivata
 * non sembra un risparmio e uno sforamento si vede subito. Una fase segnata completa conta lo speso vero:
 * il risparmio entra nel margine solo quando lo confermi. Chiuso: conta solo lo speso.
 * Il ricavo è quello dell'Order App (imponibile merce): il prezzo sta sul kit, non sulla scheda.
 */
export function riepilogoConsuntivo(schede: SchedaPrevisto[], spese: Spesa[], chiuso: boolean, ricavo: number, fasiComplete: string[] = []) {
  const righe: RigaConsuntivo[] = FASI_SPESA.map((fase) => ({ fase, previsto: 0, speso: 0, nSpese: 0, completa: fasiComplete.includes(fase), costo: 0 }));
  const altro = righe.find((r) => r.fase === "Altro")!;
  const riga = (fase: string) => righe.find((r) => r.fase === fase) ?? altro;

  let capi = 0;
  for (const s of schede) {
    if (!(s.capi > 0)) continue;
    capi += s.capi;
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
  for (const r of righe) r.costo = chiuso || r.completa ? r.speso : Math.max(r.speso, r.previsto);
  const sviluppo = riga(FASE_SVILUPPO).costo;
  // Costo operativo: senza sviluppo.
  const costo = righe.reduce((t, r) => t + r.costo, 0) - sviluppo;
  const margine = (costo: number) => (ricavo > 0 && costo > 0 ? ((ricavo - costo) / ricavo) * 100 : null);
  return {
    righe,
    capi,
    ricavo,
    previsto,
    speso,
    conFattura,
    senzaFattura,
    /** Costo reale operativo (sviluppo escluso); a consuntivo aperto, con il previsto per le fasi non complete rimaste sotto. */
    costo,
    /** Speso in sviluppo: taglie nuove e modelli nuovi. */
    sviluppo,
    /** Positivo = costo reale operativo sotto il previsto. */
    risparmio: previsto - costo,
    marginePrevisto: margine(previsto),
    /** Margine reale operativo: senza sviluppo, è quello ripetibile. */
    margineReale: margine(costo),
    /** Margine reale dopo lo sviluppo: se l'ordine ha ripagato anche l'investimento. */
    margineDopoSviluppo: sviluppo > 0 ? margine(costo + sviluppo) : null,
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

/** Margine previsto di una riga di vendita (kit o articolo): ricavo dell'Order App contro il costo delle schede. */
export interface MargineRiga {
  nome: string;
  tipo: "kit" | "articolo";
  quantita: number;
  omaggi: number;
  prezzo: number;
  ricavo: number;
  /** Costo previsto di tutto quello che si consegna, omaggi compresi. */
  costo: number;
  /** Costo per kit (o pezzo) consegnato. */
  costoUnitario: number | null;
  margine: number | null;
  /** Articoli della riga senza una scheda con il costo: il costo è incompleto. */
  senzaScheda: number;
  scontoDaVerificare: boolean;
}

/**
 * Per ogni kit (o articolo) dell'ordine: pezzi di ogni articolo × costo per capo della sua scheda.
 * `costoCapo` dà il costo per capo della scheda che copre l'articolo in quella parte (adulto o bambino).
 */
export function marginiVendita(vendita: VenditaOrdine, costoCapo: (articoloId: string, parte: Parte) => number | null): MargineRiga[] {
  return vendita.righe.map((r) => {
    let costo = 0, senzaScheda = 0;
    for (const a of r.articoli) {
      if (a.adulto + a.bambino <= 0) continue;
      const adulto = costoCapo(a.id, "adulto");
      // Senza la scheda bambino si usa il costo dell'adulto: meglio una stima che zero.
      const bambino = costoCapo(a.id, "bambino") ?? adulto;
      if ((a.adulto > 0 && adulto === null) || (a.bambino > 0 && bambino === null)) senzaScheda++;
      costo += a.adulto * (adulto ?? bambino ?? 0) + a.bambino * (bambino ?? 0);
    }
    const consegnati = r.quantita + r.omaggi;
    return {
      nome: r.nome, tipo: r.tipo, quantita: r.quantita, omaggi: r.omaggi, prezzo: r.prezzo, ricavo: r.ricavo,
      costo, costoUnitario: consegnati > 0 && costo > 0 ? costo / consegnati : null,
      margine: r.ricavo > 0 && costo > 0 ? ((r.ricavo - costo) / r.ricavo) * 100 : null,
      senzaScheda, scontoDaVerificare: r.scontoDaVerificare,
    };
  });
}
