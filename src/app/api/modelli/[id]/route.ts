import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { FASCE_MODELLO } from "@/lib/utils";

/** Il codice non si modifica (è la numerazione del modellista): si aggiornano solo gli altri campi. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { descrizione?: string; categoria?: string; fascia?: string; note?: string | null } = {};

  if (typeof body.descrizione === "string") {
    if (!body.descrizione.trim()) return NextResponse.json({ error: "La descrizione non può essere vuota" }, { status: 400 });
    data.descrizione = body.descrizione.trim();
  }
  if (typeof body.categoria === "string") {
    if (!body.categoria.trim()) return NextResponse.json({ error: "La categoria non può essere vuota" }, { status: 400 });
    data.categoria = body.categoria.trim();
  }
  if (body.fascia !== undefined) {
    if (!FASCE_MODELLO.includes(body.fascia)) return NextResponse.json({ error: "Fascia non valida" }, { status: 400 });
    data.fascia = body.fascia;
  }
  if (body.note !== undefined) data.note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  try {
    const modello = await prisma.modello.update({ where: { id }, data });
    return NextResponse.json(modello);
  } catch {
    return NextResponse.json({ error: "Modello non trovato" }, { status: 404 });
  }
}

/** Le schede che usano il modello conservano il codice: si perde solo la voce d'archivio. */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.modello.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Modello non trovato" }, { status: 404 });
  }
}
