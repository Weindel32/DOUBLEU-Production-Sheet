import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const materiali = await prisma.materiale.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(materiali);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const materiale = await prisma.materiale.create({
    data: {
      nome: body.nome, tipo: body.tipo, composizione: body.composizione,
      peso: body.peso, larghezza: body.larghezza, unitaMisura: body.unitaMisura,
      fornitore: body.fornitore, costoMetro: body.costoMetro, note: body.note,
    },
  });
  return NextResponse.json(materiale, { status: 201 });
}
