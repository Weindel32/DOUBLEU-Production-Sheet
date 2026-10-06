export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import MaterialeMobileForm from "@/components/mobile/MaterialeMobileForm";
import { suggerimentiMateriali } from "../suggerimenti";

export default async function NuovoMaterialeMobile() {
  const [materiali, voci] = await Promise.all([
    prisma.materiale.findMany({ select: { fornitore: true, composizione: true } }),
    prisma.coloreFornitore.findMany(),
  ]);
  return (
    <>
      <Testata indietro="/m/materiali" sopra="Materiali" titolo="Nuovo materiale" />
      <MaterialeMobileForm voci={voci} {...suggerimentiMateriali(materiali)} />
    </>
  );
}
