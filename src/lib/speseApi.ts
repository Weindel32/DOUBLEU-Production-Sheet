import { FASI_SPESA } from "@/lib/consuntivo";

const testo = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Importo scritto all'italiana: "1.250,50", "1.250" e "85,5" (il punto delle migliaia non è un decimale). */
export function leggiImporto(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[\s€]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

/** Corpo di una spesa dal form → campi da salvare, o il messaggio d'errore. */
export function leggiSpesa(body: Record<string, unknown>) {
  const data = testo(body.data);
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return { errore: "Data non valida" } as const;
  const fase = testo(body.fase);
  if (!fase || !(FASI_SPESA as readonly string[]).includes(fase)) return { errore: "Fase non valida" } as const;
  const importo = leggiImporto(body.importo);
  if (importo === null || !(importo > 0)) return { errore: "Inserisci un importo maggiore di zero" } as const;
  const fattura = body.fattura !== false;
  const iva = fattura ? leggiImporto(body.iva) : null;
  if (iva !== null && (iva < 0 || iva > 100)) return { errore: "Aliquota IVA non valida" } as const;
  return {
    dati: {
      data, fase, importo: Math.round(importo * 100) / 100, fattura, iva,
      fornitore: testo(body.fornitore), descrizione: testo(body.descrizione), riferimento: testo(body.riferimento),
    },
  } as const;
}
