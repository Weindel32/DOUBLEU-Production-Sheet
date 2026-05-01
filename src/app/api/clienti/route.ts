import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const clienti = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(clienti);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cliente = await prisma.cliente.create({
    data: { nome: body.nome, email: body.email, telefono: body.telefono, indirizzo: body.indirizzo, note: body.note },
  });
  return NextResponse.json(cliente, { status: 201 });
}
