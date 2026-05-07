import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const logo = await prisma.logo.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome } : {}),
      ...(body.file !== undefined ? { file: body.file } : {}),
      ...(body.tipo !== undefined ? { tipo: body.tipo } : {}),
    },
  });
  return NextResponse.json(logo);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.logo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossibile eliminare: il logo è associato a una o più schede." },
      { status: 409 }
    );
  }
}
