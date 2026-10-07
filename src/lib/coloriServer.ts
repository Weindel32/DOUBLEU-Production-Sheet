import { prisma } from "@/lib/prisma";
import { chiaveFornitore, leggiNomiTessuto } from "@/lib/colori";

/**
 * Fornitore del tessuto principale e nome che il fornitore dà a un suo codice colore:
 * servono a scrivere il colore per il produttore ("Navy · CTA col. 100 Blu scuro").
 */
export async function riferimentoColori(tessuto: string | null | undefined) {
  if (!tessuto) return { fornitore: null as string | null, nomeFornitore: (_c: string | null | undefined) => null as string | null };
  const mat = await prisma.materiale.findFirst({ where: { nome: tessuto }, select: { fornitore: true, coloriNomi: true } });
  const fornitore = mat?.fornitore ?? null;
  const voci = fornitore ? await prisma.coloreFornitore.findMany({ where: { fornitore: chiaveFornitore(fornitore) } }) : [];
  const propri = leggiNomiTessuto(mat?.coloriNomi);
  return {
    fornitore,
    nomeFornitore: (codice: string | null | undefined) =>
      codice ? propri[codice]?.nome ?? voci.find((v) => v.codice === codice)?.nome ?? null : null,
  };
}
