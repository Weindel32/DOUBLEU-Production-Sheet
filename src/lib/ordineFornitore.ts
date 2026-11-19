// Ordine al fornitore dei capi comprati già fatti (LS24): due spunte, ordinato e arrivato, con la data.
import { prisma } from "@/lib/prisma";

export interface StatoFornitore { ordinatoIl: string | null; arrivatoIl: string | null }

/**
 * Stato degli ordini al fornitore per gli ordini dati. null se la tabella non è leggibile
 * (migrazione non ancora applicata): la dashboard funziona lo stesso, senza spunte.
 */
export async function statiFornitore(ordineIds: string[]): Promise<Map<string, StatoFornitore> | null> {
  if (!ordineIds.length) return new Map();
  try {
    const righe = await prisma.ordineFornitore.findMany({ where: { ordineOrderAppId: { in: ordineIds } } });
    return new Map(righe.map((r) => [r.ordineOrderAppId, { ordinatoIl: r.ordinatoIl, arrivatoIl: r.arrivatoIl }]));
  } catch (err) {
    console.error("Ordini fornitore non letti", err);
    return null;
  }
}
