import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATI_SCHEDA = [
  { value: "bozza", label: "Bozza", color: "bg-gray-100 text-gray-700" },
  { value: "revisione", label: "In revisione", color: "bg-yellow-100 text-yellow-700" },
  { value: "approvata", label: "Approvata", color: "bg-green-100 text-green-700" },
  { value: "produzione", label: "In produzione", color: "bg-blue-100 text-blue-700" },
  { value: "consegnata", label: "Consegnata", color: "bg-purple-100 text-purple-700" },
] as const;

export type StatoScheda = typeof STATI_SCHEDA[number]["value"];

export const TAGLIE_ADULTO = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export const TAGLIE_KIDS = ["2A", "3A", "4A", "6A", "8A", "10A", "12A", "14A", "16A"] as const;
export const TAGLIE = [...TAGLIE_ADULTO, ...TAGLIE_KIDS] as const;

export const CATEGORIE = [
  "T-Shirt", "Felpa", "Pantaloncino", "Pantaloni", "Giacca",
  "Gilet", "Polo", "Canotta", "Tuta", "Gonna", "Cappello", "Calze", "Altro",
];

export const TECNICHE_LOGO = ["Ricamo", "Stampa", "Transfer", "Sublimazione", "Patch"];

export const POSIZIONI_LOGO = [
  "Lato cuore", "Retro centro", "Manica destra", "Manica sinistra",
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
