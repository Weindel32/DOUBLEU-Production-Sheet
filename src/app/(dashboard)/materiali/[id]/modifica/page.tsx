import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ModificaMaterialeForm from "./ModificaMaterialeForm";

export default async function ModificaMaterialePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [materiale, voci] = await Promise.all([
    prisma.materiale.findUnique({ where: { id } }),
    prisma.coloreFornitore.findMany(),
  ]);
  if (!materiale) notFound();
  return <ModificaMaterialeForm materiale={materiale} voci={voci} />;
}
