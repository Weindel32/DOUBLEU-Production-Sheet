export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import ElencoModelli, { type ModelloMobile } from "@/components/mobile/ElencoModelli";
import { TIPI_COSTO_DB } from "@/lib/utils";

/** Archivio dei modelli dal telefono, da consultare dal modellista: sola lettura. */
export default async function ModelliMobile() {
  const [modelli, schede] = await Promise.all([
    prisma.modello.findMany({ orderBy: { codice: "asc" } }),
    prisma.scheda.findMany({
      where: { codiceModello: { not: null } },
      select: { id: true, codice: true, codiceModello: true, nomeArticolo: true, tipo: true, immagini: true, ordineOrderAppId: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const righe: ModelloMobile[] = modelli.map((m) => {
    const chiave = m.codice.trim().toLowerCase();
    const sue = schede.filter((s) => s.codiceModello!.trim().toLowerCase() === chiave);
    // Foto: la scheda più recente che ne ha una.
    const foto = sue.map((s) => { try { return (JSON.parse(s.immagini || "[]") as string[])[0]; } catch { return undefined; } }).find(Boolean) ?? null;
    return {
      id: m.id, codice: m.codice, descrizione: m.descrizione, categoria: m.categoria, fascia: m.fascia, note: m.note, foto,
      ordini: new Set(sue.filter((s) => !TIPI_COSTO_DB.includes(s.tipo) && s.ordineOrderAppId).map((s) => s.ordineOrderAppId)).size,
      schede: sue.slice(0, 6).map((s) => ({ id: s.id, nome: s.nomeArticolo, codice: s.codice, ordine: TIPI_COSTO_DB.includes(s.tipo) ? null : s.ordineOrderAppId })),
    };
  });

  return (
    <>
      <Testata indietro="/m" sopra="Archivio" titolo="Modelli" />
      <ElencoModelli modelli={righe} />
    </>
  );
}
