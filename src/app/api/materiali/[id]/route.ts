import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const materiale = await prisma.materiale.findUnique({ where: { id } });
  if (!materiale) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(materiale);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const materiale = await prisma.materiale.update({
    where: { id },
    data: {
      nome: body.nome,
      tipo: body.tipo,
      composizione: body.composizione,
      peso: body.peso,
      unitaPeso: body.unitaPeso,
      larghezza: body.larghezza,
      unitaMisura: body.unitaMisura,
      fornitore: body.fornitore,
      costoMetro: body.costoMetro,
      note: body.note,
    },
  });
  return NextResponse.json(materiale);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.materiale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
