export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import ClientiClient from "@/components/clienti/ClientiClient";

export default async function ClientiPage() {
  const clienti = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { schede: true } } },
  });

  return <ClientiClient clientiIniziali={clienti} />;
}
