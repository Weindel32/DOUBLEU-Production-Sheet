import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATI_SCHEDA = [
  { value: "bozza",     label: "Bozza",     color: "bg-gray-100 text-gray-700" },
  { value: "esecutiva", label: "Esecutiva", color: "bg-green-100 text-green-700" },
] as const;

export type StatoScheda = typeof STATI_SCHEDA[number]["value"];

export const TAGLIE_ADULTO = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const TAGLIE_KIDS = ["4A", "6A", "8A", "10A", "12A", "14A", "16A"] as const;
export const TAGLIE = [...TAGLIE_ADULTO, ...TAGLIE_KIDS] as const;

export const CATEGORIE = [
  "T-Shirt PRF", "T-Shirt WS", "T-Shirt COT",
  "Polo", "Hoodie", "Zip Hoodie", "Sweatshirt", "Jacket",
  "Sweatpants", "Short", "Skirt", "Dress", "Altro",
];

export const TIPI_SCHEDA = [
  { value: "preventivo", label: "Preventivo di costo", breve: "Preventivo" },
  { value: "produzione", label: "Ordine di produzione", breve: "Ordine" },
] as const;

export type TipoScheda = typeof TIPI_SCHEDA[number]["value"];

export const CATEGORIE_ELASTICO = ["Short", "Skirt", "Sweatpants"];

export const TECNICHE_LOGO = ["Ricamo", "Stampa", "Transfer", "Sublimazione", "Patch"];

export const POSIZIONI_LOGO = [
  "Lato cuore", "Lato destro", "Retro centro", "Manica destra", "Manica sinistra",
  "Petto centro", "Collo retro", "Fondo schiena", "Cappuccio",
];

export function formatData(date: Date | string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatOra(date: Date | string): string {
  return new Date(date).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generaCodiceScheda(categoria: string): string {
  const prefix = categoria.substring(0, 3).toUpperCase().replace(/\s/g, "");
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${Date.now().toString().slice(-4)}-${num}`;
}

export function calcolaTotaleQuantita(quantitaTaglia: Record<string, number>): number {
  return Object.values(quantitaTaglia).reduce((sum, q) => sum + (q || 0), 0);
}

export function parseNumIt(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

interface MaterialePesoInfo {
  peso?: string | null;
  unitaPeso?: string | null;
  larghezza?: string | null;
}

/**
 * Converte un peso espresso in g/m (grammi al metro lineare, "GR MTL") nell'equivalente
 * g/m² (grammatura standard da comunicare al cliente), dividendo per l'altezza del
 * tessuto in metri. I due valori non sono la stessa grandezza: un rotolo più stretto
 * "pesa" meno al metro lineare a parità di grammatura reale del tessuto.
 */
export function calcolaGrammiMq(mat: MaterialePesoInfo): number | null {
  if (mat.unitaPeso !== "g/m") return null;
  const pesoGm = parseNumIt(mat.peso);
  const larghezzaCm = parseNumIt(mat.larghezza);
  if (!pesoGm || !larghezzaCm) return null;
  return pesoGm / (larghezzaCm / 100);
}

/**
 * Grammatura commerciale (g/m²) di un materiale, indipendentemente dall'unità in cui
 * è stato inserito il peso: se già g/m² è il peso stesso, se g/m lineare va convertito
 * (serve l'altezza tessuto). Questo è il numero da comunicare al cliente/catalogo.
 */
export function calcolaGrammaturaCommerciale(mat: MaterialePesoInfo): number | null {
  if (mat.unitaPeso === "g/m²") return parseNumIt(mat.peso);
  if (mat.unitaPeso === "g/m") return calcolaGrammiMq(mat);
  return null;
}

/**
 * Come calcolaGrammaturaCommerciale, ma a partire dai campi testo liberi della scheda
 * produzione ("195 g/m²", "660 g/m") invece che dai campi strutturati del materiale.
 */
export function parseGrammaturaCommerciale(
  pesoTessuto: string | null | undefined,
  altezzaTessuto: string | null | undefined
): number | null {
  if (!pesoTessuto) return null;
  const peso = parseNumIt(pesoTessuto);
  if (!peso) return null;
  if (/m\s*[²2]/i.test(pesoTessuto)) return peso;
  if (/g\s*\/\s*m\b/i.test(pesoTessuto)) {
    const larghezzaCm = parseNumIt(altezzaTessuto);
    if (!larghezzaCm) return null;
    return peso / (larghezzaCm / 100);
  }
  return null;
}

/** Kg per metro lineare, dato peso (g/m² o g/m) e altezza tessuto (cm). Null se dati insufficienti. */
export function calcolaKgPerMetroLineare(mat: MaterialePesoInfo): number | null {
  const peso = parseNumIt(mat.peso);
  if (!peso) return null;
  if (mat.unitaPeso === "g/m") return peso / 1000;
  const larghezza = parseNumIt(mat.larghezza);
  if (!larghezza) return null;
  return (peso * larghezza) / 100000;
}

interface MaterialeCostoInfo extends MaterialePesoInfo {
  costoMetro?: number | null;
  prezzoKg?: number | null;
  unitaMisura?: string | null;
}

/** Arrotonda ai centesimi evitando gli errori di virgola mobile (2.925 → 2.93). */
function arrotondaCentesimi(n: number): number {
  return Math.round(parseFloat((n * 100).toFixed(6))) / 100;
}

/**
 * €/m di un tessuto acquistato al kg: kg per metro lineare × prezzo al kg.
 * È il valore da salvare in costoMetro (stessa convenzione del Kit Builder).
 * Null se mancano prezzo, peso o altezza tessuto.
 */
export function calcolaCostoMetroDaPrezzoKg(mat: MaterialeCostoInfo): number | null {
  if (!mat.prezzoKg) return null;
  const kgPerM = calcolaKgPerMetroLineare(mat);
  if (kgPerM === null) return null;
  return arrotondaCentesimi(kgPerM * mat.prezzoKg);
}

/**
 * Costo effettivo per metro lineare di un materiale. costoMetro è sempre €/m anche per
 * i tessuti acquistati al kg (il prezzo al kg sta in prezzoKg): se per un tessuto al kg
 * costoMetro manca, lo si ricava da prezzoKg. Per i materiali al pezzo ritorna null.
 */
export function calcolaCostoAlMetro(mat: MaterialeCostoInfo): number | null {
  if (mat.unitaMisura === "pz") return null;
  if (mat.costoMetro) return mat.costoMetro;
  if (mat.unitaMisura === "kg") return calcolaCostoMetroDaPrezzoKg(mat);
  return null;
}

/**
 * Costo unitario da moltiplicare per il consumo per capo: €/m per tessuti (a metro o
 * al kg), €/pz per i materiali al pezzo. 0 se non determinabile.
 */
export function calcolaCostoUnitarioConsumo(mat: MaterialeCostoInfo | null | undefined): number {
  if (!mat) return 0;
  if (mat.unitaMisura === "pz") return mat.costoMetro || 0;
  return calcolaCostoAlMetro(mat) ?? 0;
}

export interface RiepilogoCosti {
  materiali: number;
  accessori: number;
  lavorazioni: number;
  totale: number;
  prezzoVendita: number;
  /** Margine sul prezzo di vendita in %, null se manca prezzo o costo. */
  margine: number | null;
}

/**
 * Costo per capo di una scheda: consumo materiali × costo unitario attuale del materiale,
 * più accessori e lavorazioni. Usato da scheda e lista, così il numero è lo stesso ovunque.
 */
export function calcolaRiepilogoCosti(
  input: {
    consumi: { materialeId: string; consumoPerCapo: number; costoUnitario?: number }[];
    accessori: { quantita: number; prezzoUnitario: number }[];
    lavorazioni: (number | null | undefined)[];
    prezzoVendita: number | null | undefined;
  },
  materiali: (MaterialeCostoInfo & { id: string })[],
): RiepilogoCosti {
  const mat = input.consumi.reduce((sum, c) => {
    const m = materiali.find((x) => x.id === c.materialeId);
    const unitario = m ? calcolaCostoUnitarioConsumo(m) : (c.costoUnitario || 0);
    return sum + (c.consumoPerCapo || 0) * unitario;
  }, 0);
  const acc = input.accessori.reduce((sum, a) => sum + (a.quantita || 0) * (a.prezzoUnitario || 0), 0);
  const lav = input.lavorazioni.reduce<number>((sum, v) => sum + (v || 0), 0);
  const totale = mat + acc + lav;
  const prezzo = input.prezzoVendita || 0;
  return {
    materiali: mat,
    accessori: acc,
    lavorazioni: lav,
    totale,
    prezzoVendita: prezzo,
    margine: prezzo > 0 && totale > 0 ? ((prezzo - totale) / prezzo) * 100 : null,
  };
}

/** Prezzo di vendita che dà il margine indicato (in %) sul costo. */
export function prezzoDaMargine(costo: number, marginePct: number): number {
  if (marginePct >= 100) return 0;
  return costo / (1 - marginePct / 100);
}

export function formatEuro(n: number): string {
  return "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
