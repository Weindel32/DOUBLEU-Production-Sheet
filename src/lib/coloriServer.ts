import { prisma } from "@/lib/prisma";
import { chiaveFornitore, coloriTessuto, dizionarioFornitore, leggiCodici, leggiNomiTessuto } from "@/lib/colori";

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

/** Per ogni tessuto con colori: i colori DOUBLEU e i codici con cui si ordinano (vista "per colore"). */
export async function coloriDisponibili() {
  const [voci, materiali] = await Promise.all([
    prisma.coloreFornitore.findMany(),
    prisma.materiale.findMany({ where: { colori: { not: null } }, select: { id: true, nome: true, fornitore: true, colori: true, coloriNomi: true }, orderBy: { nome: "asc" } }),
  ]);
  return materiali.flatMap((m) =>
    coloriTessuto(leggiCodici(m.colori), dizionarioFornitore(voci, m.fornitore), leggiNomiTessuto(m.coloriNomi))
      .filter((c) => c.doubleu)
      .map((c) => ({
        doubleu: c.doubleu!, materialeId: m.id, tessuto: m.nome, fornitore: chiaveFornitore(m.fornitore),
        codice: c.codice, nome: c.nome, hex: c.hex,
      })));
}
