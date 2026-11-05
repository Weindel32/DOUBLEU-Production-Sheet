// Costo della referenza: costo per capo di ogni voce × pezzi. Lo usano la scheda e il PDF interno,
// così i numeri sono gli stessi. È il previsto: lo speso reale sta nel consuntivo dell'ordine.

import { calcolaAcquistoMateriale, calcolaCostoUnitarioConsumo, type MaterialeCostoInfo } from "@/lib/utils";

/** Una voce del costo per capo: materiale, accessori o lavorazione. */
export interface VoceCosto {
  /** Fase come nel consuntivo dell'ordine, così i due conti si leggono allo stesso modo. */
  fase: "Tessuto" | "Accessori" | "Taglio" | "Confezione" | "Stampa" | "Ricamo";
  nome: string;
  /** Fornitore del materiale, elenco accessori. Per la confezione il fasonista lo aggiunge chi mostra. */
  dettaglio: string | null;
  perCapo: number;
  /** Solo materiali: consumo netto per l'intera referenza (metri, kg o pezzi), senza scarto. */
  quantita: string | null;
  /** Prezzo o costo non inserito. */
  manca: boolean;
}

const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

export function vociCosto(
  input: {
    consumi: { materialeId: string; consumoPerCapo: number }[];
    accessori: { nome: string; quantita: number; prezzoUnitario: number }[];
    taglio: number | null;
    cucitura: number | null;
    stampa: number | null;
    ricamo: number | null;
  },
  materiali: (MaterialeCostoInfo & { id: string; nome: string; fornitore?: string | null })[],
  pezzi: number,
): VoceCosto[] {
  const materialiVoci = input.consumi.flatMap((c): VoceCosto[] => {
    const mat = materiali.find((m) => m.id === c.materialeId);
    if (!mat) return [];
    const unitario = calcolaCostoUnitarioConsumo(mat);
    const a = calcolaAcquistoMateriale(mat, c.consumoPerCapo, pezzi);
    const quantita = !a ? null
      : a.unita === "kg" ? `${num1(a.netto)} kg · ${num1(a.metri!)} m`
      : `${num1(a.netto)} ${a.unita}`;
    return [{ fase: "Tessuto", nome: mat.nome, dettaglio: mat.fornitore || null, perCapo: (c.consumoPerCapo || 0) * unitario, quantita, manca: unitario <= 0 }];
  });
  const accessori: VoceCosto[] = input.accessori.length === 0 ? [] : [{
    fase: "Accessori", nome: "Accessori",
    dettaglio: input.accessori.map((a) => a.nome).filter(Boolean).join(", ") || null,
    perCapo: input.accessori.reduce((t, a) => t + (a.quantita || 0) * (a.prezzoUnitario || 0), 0),
    quantita: null,
    manca: input.accessori.some((a) => !(a.prezzoUnitario > 0)),
  }];
  // Taglio e confezione ci sono sempre: se mancano si deve vedere. Stampa e ricamo solo se usati.
  const lavorazioni = ([
    ["Taglio", input.taglio, true],
    ["Confezione", input.cucitura, true],
    ["Stampa", input.stampa, false],
    ["Ricamo", input.ricamo, false],
  ] as const).flatMap(([fase, valore, sempre]): VoceCosto[] => {
    const v = valore ?? 0;
    if (!sempre && v <= 0) return [];
    return [{ fase, nome: fase, dettaglio: null, perCapo: v, quantita: null, manca: v <= 0 }];
  });
  return [...materialiVoci, ...accessori, ...lavorazioni];
}

export function totaliReferenza(voci: VoceCosto[], pezzi: number, prezzoVendita: number) {
  const costoCapo = voci.reduce((t, v) => t + v.perCapo, 0);
  const totale = costoCapo * pezzi;
  const ricavo = prezzoVendita > 0 ? prezzoVendita * pezzi : 0;
  const margine = ricavo > 0 && totale > 0 ? ricavo - totale : null;
  return { costoCapo, totale, ricavo, margine, marginePct: margine !== null ? (margine / ricavo) * 100 : null };
}
