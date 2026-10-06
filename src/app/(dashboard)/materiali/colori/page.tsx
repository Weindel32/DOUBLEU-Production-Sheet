export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import ColoriFornitoriClient, { type RigaColore } from "@/components/materiali/ColoriFornitoriClient";
import { chiaveFornitore, leggiCodici } from "@/lib/colori";

/** Nomi dei codici colore per fornitore, con i tessuti in cui compaiono e i codici ancora senza nome. */
export default async function ColoriFornitoriPage() {
  const [voci, materiali] = await Promise.all([
    prisma.coloreFornitore.findMany(),
    prisma.materiale.findMany({ where: { colori: { not: null } }, select: { nome: true, fornitore: true, colori: true } }),
  ]);

  const righe = new Map<string, RigaColore>();
  const chiave = (f: string, c: string) => `${f}|${c}`;
  for (const v of voci)
    righe.set(chiave(v.fornitore, v.codice), { id: v.id, fornitore: v.fornitore, codice: v.codice, nome: v.nome, hex: v.hex, tessuti: [] });
  for (const m of materiali) {
    const f = chiaveFornitore(m.fornitore);
    if (!f) continue;
    for (const codice of leggiCodici(m.colori)) {
      const k = chiave(f, codice);
      if (!righe.has(k)) righe.set(k, { id: null, fornitore: f, codice, nome: null, hex: null, tessuti: [] });
      righe.get(k)!.tessuti.push(m.nome);
    }
  }
  const ordinate = [...righe.values()].sort((a, b) =>
    a.fornitore.localeCompare(b.fornitore) || a.codice.localeCompare(b.codice, "it", { numeric: true }));

  return <ColoriFornitoriClient righe={ordinate} />;
}
