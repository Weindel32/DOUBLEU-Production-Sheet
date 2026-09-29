export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import ScegliScheda from "@/components/mobile/ScegliScheda";
import { TIPI_COSTO_DB, totaleSviluppo } from "@/lib/utils";
import type { Campione } from "@/types";

/** Primo passo della spesa campione: scegliere l'articolo (o l'ordine) a cui appartiene. */
export default async function CampioniMobile() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, codice: true, codiceModello: true, nomeArticolo: true, tipo: true, campioni: true, immagini: true },
  });
  const righe = schede.map((s) => {
    const campioni: Campione[] = s.campioni ? JSON.parse(s.campioni) : [];
    const immagini: string[] = s.immagini ? JSON.parse(s.immagini) : [];
    const n = campioni.length;
    return {
      id: s.id,
      titolo: s.nomeArticolo,
      codice: s.codiceModello || s.codice,
      gruppo: TIPI_COSTO_DB.includes(s.tipo) ? "Articoli" : "Ordini",
      dettaglio: n > 0 ? `${n} ${n === 1 ? "campione" : "campioni"} · € ${totaleSviluppo(campioni).toFixed(2).replace(".", ",")}` : "Nessun campione",
      foto: immagini[0] ?? null,
    };
  });
  return (
    <>
      <Testata indietro="/m" sopra="Spesa campione" titolo="Per quale articolo?" />
      <ScegliScheda righe={righe} base="/m/campioni" gruppi={["Articoli", "Ordini"]} />
    </>
  );
}
