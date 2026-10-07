export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import ColoriFornitoriClient, { type RigaColore } from "@/components/materiali/ColoriFornitoriClient";
import type { DisponibileColore } from "@/components/materiali/ColoriPerDoubleu";
import { chiaveFornitore, leggiCodici, leggiNomiTessuto } from "@/lib/colori";
import { coloriDisponibili } from "@/lib/coloriServer";

/** Nomi dei codici colore per fornitore, con i tessuti in cui compaiono e i codici ancora senza nome. */
export default async function ColoriFornitoriPage() {
  const [voci, materiali] = await Promise.all([
    prisma.coloreFornitore.findMany(),
    prisma.materiale.findMany({ where: { colori: { not: null } }, select: { id: true, nome: true, fornitore: true, colori: true, coloriNomi: true }, orderBy: { nome: "asc" } }),
  ]);

  const righe = new Map<string, RigaColore>();
  const chiave = (f: string, c: string) => `${f}|${c}`;
  for (const v of voci)
    righe.set(chiave(v.fornitore, v.codice), { id: v.id, fornitore: v.fornitore, codice: v.codice, nome: v.nome, hex: v.hex, doubleu: v.doubleu, tessuti: [], senzaNomeProprio: 0 });
  for (const m of materiali) {
    const f = chiaveFornitore(m.fornitore);
    if (!f) continue;
    const propri = leggiNomiTessuto(m.coloriNomi);
    for (const codice of leggiCodici(m.colori)) {
      const k = chiave(f, codice);
      if (!righe.has(k)) righe.set(k, { id: null, fornitore: f, codice, nome: null, hex: null, doubleu: null, tessuti: [], senzaNomeProprio: 0 });
      // Su questo tessuto il codice ha un nome suo: lo si vede accanto al tessuto.
      const p = propri[codice];
      righe.get(k)!.tessuti.push(p ? `${m.nome} (${p.doubleu ?? p.nome})` : m.nome);
      if (!propri[codice]) righe.get(k)!.senzaNomeProprio++;
    }
  }
  const ordinate = [...righe.values()].sort((a, b) =>
    a.fornitore.localeCompare(b.fornitore) || a.codice.localeCompare(b.codice, "it", { numeric: true }));

  // Vista per colore DOUBLEU: in quali tessuti c'è e con quale codice si ordina.
  const disponibili: DisponibileColore[] = await coloriDisponibili();

  return <ColoriFornitoriClient righe={ordinate} disponibili={disponibili} />;
}
