import { prisma } from "@/lib/prisma";
import { TIPI_COSTO_DB } from "@/lib/utils";
import { riepilogoScheda } from "@/lib/costiScheda";

export interface CostoModello { id: string; nome: string; totale: number }

/** Articoli di costo già creati, per codice modello: servono a non crearne un doppione. */
export async function costiPerModello(): Promise<Record<string, CostoModello[]>> {
  const [schede, materiali] = await Promise.all([
    prisma.scheda.findMany({ where: { tipo: { in: TIPI_COSTO_DB }, codiceModello: { not: null } }, orderBy: { updatedAt: "desc" } }),
    prisma.materiale.findMany(),
  ]);
  const mappa: Record<string, CostoModello[]> = {};
  for (const s of schede) {
    const k = s.codiceModello!.trim().toLowerCase();
    (mappa[k] ??= []).push({ id: s.id, nome: s.nomeArticolo, totale: riepilogoScheda(s, materiali).totale });
  }
  return mappa;
}
