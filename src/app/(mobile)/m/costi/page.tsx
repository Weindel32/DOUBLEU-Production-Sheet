export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import CostiAlVolo from "@/components/mobile/CostiAlVolo";
import { TIPI_COSTO_DB } from "@/lib/utils";
import { riepilogoScheda } from "@/lib/costiScheda";

/** Articoli di costo con costo per capo, prezzo e margine: da consultare in trattativa. */
export default async function CostiMobile() {
  const [schede, materiali] = await Promise.all([
    prisma.scheda.findMany({ where: { tipo: { in: TIPI_COSTO_DB } }, orderBy: { nomeArticolo: "asc" } }),
    prisma.materiale.findMany(),
  ]);
  const articoli = schede.map((s) => {
    const r = riepilogoScheda(s, materiali);
    const immagini: string[] = s.immagini ? JSON.parse(s.immagini) : [];
    return {
      id: s.id,
      nome: s.nomeArticolo,
      codice: s.codiceModello || s.codice,
      categoria: s.categoria,
      foto: immagini[0] ?? null,
      materiali: r.materiali, accessori: r.accessori, lavorazioni: r.lavorazioni,
      costo: r.totale, prezzo: r.prezzoVendita, margine: r.margine,
    };
  });
  return (
    <>
      <Testata indietro="/m" sopra="Costo al volo" titolo="Articoli" />
      <CostiAlVolo articoli={articoli} />
    </>
  );
}
