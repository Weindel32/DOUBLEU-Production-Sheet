import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leggiSpesa } from "@/lib/speseApi";

type Params = { params: Promise<{ id: string; spesaId: string }> };

/** La spesa deve essere di quest'ordine: l'id da solo non basta. */
const trova = (id: string, spesaId: string) => prisma.spesaOrdine.findFirst({ where: { id: spesaId, ordineOrderAppId: id } });

export async function PUT(req: NextRequest, { params }: Params) {
  const { id, spesaId } = await params;
  if (!(await trova(id, spesaId))) return NextResponse.json({ error: "Spesa non trovata" }, { status: 404 });
  const letta = leggiSpesa(await req.json().catch(() => ({})));
  if ("errore" in letta) return NextResponse.json({ error: letta.errore }, { status: 400 });
  const spesa = await prisma.spesaOrdine.update({ where: { id: spesaId }, data: letta.dati });
  return NextResponse.json(spesa);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, spesaId } = await params;
  if (!(await trova(id, spesaId))) return NextResponse.json({ error: "Spesa non trovata" }, { status: 404 });
  await prisma.spesaOrdine.delete({ where: { id: spesaId } });
  return NextResponse.json({ ok: true });
}
