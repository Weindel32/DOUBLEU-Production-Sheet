import { calcolaRiepilogoCosti, type RiepilogoCosti, type MaterialeCostoInfo } from "@/lib/utils";

type SchedaCosti = {
  consumoMateriale: string | null;
  accessori: string | null;
  costoTaglio: number | null;
  costoCucitura: number | null;
  costoStampa: number | null;
  costoRicamo: number | null;
  costoLavorazione: number | null;
  prezzoVendita: number | null;
};

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/** Costo per capo di una scheda letta dal database, con i prezzi attuali dei materiali. */
export function riepilogoScheda(s: SchedaCosti, materiali: (MaterialeCostoInfo & { id: string })[]): RiepilogoCosti {
  const lavSplit = [s.costoTaglio, s.costoCucitura, s.costoStampa, s.costoRicamo];
  return calcolaRiepilogoCosti(
    {
      consumi: parseJson(s.consumoMateriale, []),
      accessori: parseJson(s.accessori, []),
      // Schede vecchie: solo il totale lavorazione, senza il dettaglio per voce.
      lavorazioni: lavSplit.some((v) => v !== null) ? lavSplit : [s.costoLavorazione],
      prezzoVendita: s.prezzoVendita,
    },
    materiali,
  );
}
