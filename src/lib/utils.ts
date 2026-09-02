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
  "Polo", "Hoodie", "Zip Hoodie", "Sweatshirt",
  "Sweatpants", "Short", "Skirt", "Dress", "Altro",
];

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
  unitaMisura?: string | null;
}

/**
 * Costo effettivo per metro lineare di un materiale, indipendentemente dall'unità
 * in cui è stato inserito il prezzo (€/m, €/kg, €/pz). Per €/kg serve peso + altezza
 * tessuto: senza questi dati la conversione non è possibile e ritorna null.
 */
export function calcolaCostoAlMetro(mat: MaterialeCostoInfo): number | null {
  if (!mat.costoMetro) return null;
  if (mat.unitaMisura === "kg") {
    const kgPerM = calcolaKgPerMetroLineare(mat);
    if (kgPerM === null) return null;
    return kgPerM * mat.costoMetro;
  }
  if (mat.unitaMisura === "pz") return null;
  return mat.costoMetro;
}
