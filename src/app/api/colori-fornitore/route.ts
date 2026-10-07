import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { chiaveFornitore, hexDoubleu } from "@/lib/colori";

export async function GET() {
  const voci = await prisma.coloreFornitore.findMany({ orderBy: [{ fornitore: "asc" }, { codice: "asc" }] });
  return NextResponse.json(voci);
}

/** Dà (o cambia) nome del fornitore e colore DOUBLEU a un codice colore. */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const fornitore = chiaveFornitore(body.fornitore);
  const codice = String(body.codice ?? "").trim().toUpperCase();
  const nome = String(body.nome ?? "").trim();
  if (!fornitore || !codice || !nome)
    return NextResponse.json({ error: "Fornitore, codice e nome sono obbligatori" }, { status: 400 });
  const doubleu = typeof body.doubleu === "string" && hexDoubleu(body.doubleu) ? body.doubleu : null;
  // Senza un pallino proprio prende quello del colore DOUBLEU.
  const hex = typeof body.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(body.hex) ? body.hex : hexDoubleu(doubleu);
  const voce = await prisma.coloreFornitore.upsert({
    where: { fornitore_codice: { fornitore, codice } },
    create: { fornitore, codice, nome, hex, doubleu },
    update: { nome, hex, doubleu },
  });
  return NextResponse.json(voce);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
  await prisma.coloreFornitore.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
