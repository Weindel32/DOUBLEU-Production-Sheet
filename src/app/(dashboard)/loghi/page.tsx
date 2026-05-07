export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import LoghiClient from "@/components/loghi/LoghiClient";

export default async function LoghiPage() {
  const loghi = await prisma.logo.findMany({ orderBy: { nome: "asc" } });
  return <LoghiClient loghiIniziali={loghi} />;
}
