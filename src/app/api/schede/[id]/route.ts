import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  if (!scheda) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  return NextResponse.json(scheda);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = { ...body };

  if (body.tabellaMisure !== undefined)
    data.tabellaMisure = body.tabellaMisure ? JSON.stringify(body.tabellaMisure) : null;
  if (body.quantitaTaglia !== undefined)
    data.quantitaTaglia = body.quantitaTaglia ? JSON.stringify(body.quantitaTaglia) : null;
  if (body.allegati !== undefined)
    data.allegati = body.allegati ? JSON.stringify(body.allegati) : null;
  if (body.consumoMateriale !== undefined)
    data.consumoMateriale = body.consumoMateriale ? JSON.stringify(body.consumoMateriale) : null;
  if (body.elasticoVita !== undefined)
    data.elasticoVita = body.elasticoVita ? JSON.stringify(body.elasticoVita) : null;
  if (body.immagini !== undefined)
    data.immagini = body.immagini ? JSON.stringify(body.immagini) : null;

  const scheda = await prisma.scheda.update({
    where: { id },
    data,
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  return NextResponse.json(scheda);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scheda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
