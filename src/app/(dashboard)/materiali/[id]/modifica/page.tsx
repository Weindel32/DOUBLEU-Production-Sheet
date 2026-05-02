import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ModificaMaterialeForm from "./ModificaMaterialeForm";

export default async function ModificaMaterialePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const materiale = await prisma.materiale.findUnique({ where: { id } });
  if (!materiale) notFound();
  return <ModificaMaterialeForm materiale={materiale} />;
}
