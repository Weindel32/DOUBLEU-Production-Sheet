export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Testata from "@/components/mobile/Testata";
import MaterialeMobileForm from "@/components/mobile/MaterialeMobileForm";
import { suggerimentiMateriali } from "../suggerimenti";

export default async function ModificaMaterialeMobile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [materiale, tutti, voci] = await Promise.all([
    prisma.materiale.findUnique({ where: { id } }),
    prisma.materiale.findMany({ select: { fornitore: true, composizione: true } }),
    prisma.coloreFornitore.findMany(),
  ]);
  if (!materiale) notFound();
  return (
    <>
      <Testata indietro="/m/materiali" sopra={materiale.fornitore || "Materiale"} titolo={materiale.nome} />
      <MaterialeMobileForm materiale={materiale} voci={voci} {...suggerimentiMateriali(tutti)} />
    </>
  );
}
