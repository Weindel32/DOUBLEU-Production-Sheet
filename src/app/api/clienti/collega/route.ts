import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { clientiOrderApp } from "@/lib/orderApp";

/** Collega un cliente dell'Order App: lo crea qui la prima volta, poi riusa sempre lo stesso. */
export async function POST(req: NextRequest) {
  const { orderAppId } = await req.json();
  if (!orderAppId) return NextResponse.json({ error: "Cliente mancante" }, { status: 400 });
  const esistente = await prisma.cliente.findUnique({ where: { orderAppId } });
  if (esistente) return NextResponse.json(esistente);

  const oa = (await clientiOrderApp()).find((c) => c.id === orderAppId);
  if (!oa) return NextResponse.json({ error: "Cliente non trovato nell'Order App" }, { status: 404 });
  const cliente = await prisma.cliente.create({ data: { nome: oa.nome, citta: oa.citta, orderAppId: oa.id } });
  return NextResponse.json(cliente, { status: 201 });
}
