import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { FASCE_MODELLO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const codice = req.nextUrl.searchParams.get("codice");
  if (codice) {
    const modello = await prisma.modello.findUnique({ where: { codice } });
    return modello ? NextResponse.json(modello) : NextResponse.json({ error: "Modello non trovato" }, { status: 404 });
  }
  const modelli = await prisma.modello.findMany({ orderBy: [{ categoria: "asc" }, { codice: "asc" }] });
  return NextResponse.json(modelli);
}

/** Nuovo modello: il codice è quello del modellista, si salva esattamente come scritto. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const codice = typeof body.codice === "string" ? body.codice.trim() : "";
  const descrizione = typeof body.descrizione === "string" ? body.descrizione.trim() : "";
  const categoria = typeof body.categoria === "string" ? body.categoria.trim() : "";
  const fascia = body.fascia;

  if (!codice || !descrizione || !categoria)
    return NextResponse.json({ error: "Codice, descrizione e categoria sono obbligatori" }, { status: 400 });
  if (!FASCE_MODELLO.includes(fascia))
    return NextResponse.json({ error: "Fascia non valida" }, { status: 400 });

  const esistente = await prisma.modello.findUnique({ where: { codice } });
  if (esistente)
    return NextResponse.json({ error: `Il modello ${codice} esiste già (${esistente.descrizione})` }, { status: 409 });

  const modello = await prisma.modello.create({
    data: { codice, descrizione, categoria, fascia, note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null },
  });
  return NextResponse.json(modello, { status: 201 });
}
