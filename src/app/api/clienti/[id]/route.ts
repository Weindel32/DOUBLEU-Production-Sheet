import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      nome: body.nome,
      email: body.email || null,
      telefono: body.telefono || null,
      indirizzo: body.indirizzo || null,
      note: body.note || null,
    },
  });
  return NextResponse.json(cliente);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossibile eliminare: il cliente ha schede associate." },
      { status: 409 }
    );
  }
}
