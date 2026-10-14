import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// I clienti si creano nell'Order App: qui si collegano (vedi /api/clienti/collega).
export async function GET() {
  const clienti = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(clienti);
}
