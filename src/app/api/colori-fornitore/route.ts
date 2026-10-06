import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { chiaveFornitore } from "@/lib/colori";

export async function GET() {
  const voci = await prisma.coloreFornitore.findMany({ orderBy: [{ fornitore: "asc" }, { codice: "asc" }] });
  return NextResponse.json(voci);
}

/** Dà (o cambia) il nome a un codice colore di un fornitore. */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const fornitore = chiaveFornitore(body.fornitore);
  const codice = String(body.codice ?? "").trim().toUpperCase();
  const nome = String(body.nome ?? "").trim();
  if (!fornitore || !codice || !nome)
    return NextResponse.json({ error: "Fornitore, codice e nome sono obbligatori" }, { status: 400 });
  const hex = typeof body.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex) ? body.hex : null;
  const voce = await prisma.coloreFornitore.upsert({
    where: { fornitore_codice: { fornitore, codice } },
    create: { fornitore, codice, nome, hex },
    update: { nome, hex },
  });
  return NextResponse.json(voce);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
  await prisma.coloreFornitore.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
