export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { TIPI_COSTO_DB } from "@/lib/utils";
import ModelliClient, { type ModelloRiga } from "@/components/modelli/ModelliClient";

export default async function ModelliPage() {
  const [modelli, conteggi] = await Promise.all([
    prisma.modello.findMany({ orderBy: { codice: "asc" } }),
    prisma.scheda.groupBy({ by: ["codiceModello", "tipo"], where: { codiceModello: { not: null } }, _count: { _all: true } }),
  ]);

  const righe: ModelloRiga[] = modelli.map((m) => {
    const mie = conteggi.filter((c) => c.codiceModello === m.codice);
    const articoli = mie.filter((c) => TIPI_COSTO_DB.includes(c.tipo)).reduce((s, c) => s + c._count._all, 0);
    const ordini = mie.filter((c) => !TIPI_COSTO_DB.includes(c.tipo)).reduce((s, c) => s + c._count._all, 0);
    return { id: m.id, codice: m.codice, descrizione: m.descrizione, categoria: m.categoria, fascia: m.fascia, note: m.note, articoli, ordini };
  });

  return <ModelliClient modelli={righe} />;
}
