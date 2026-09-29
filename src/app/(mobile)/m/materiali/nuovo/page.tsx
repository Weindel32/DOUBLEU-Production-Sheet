export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import MaterialeMobileForm from "@/components/mobile/MaterialeMobileForm";
import { suggerimentiMateriali } from "../suggerimenti";

export default async function NuovoMaterialeMobile() {
  const materiali = await prisma.materiale.findMany({ select: { fornitore: true, composizione: true } });
  return (
    <>
      <Testata indietro="/m/materiali" sopra="Materiali" titolo="Nuovo materiale" />
      <MaterialeMobileForm {...suggerimentiMateriali(materiali)} />
    </>
  );
}
