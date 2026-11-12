import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { FASCE_MODELLO, chiaveCodice } from "@/lib/utils";

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

  // Stesso codice anche se scritto con spazi diversi ("DUSP218" = "DUSP 218"): niente doppioni in archivio.
  const chiave = chiaveCodice(codice);
  const esistente = (await prisma.modello.findMany({ select: { codice: true, descrizione: true, categoria: true, fascia: true } }))
    .find((m) => chiaveCodice(m.codice) === chiave);
  if (esistente)
    return NextResponse.json({ error: `Il modello esiste già come ${esistente.codice} (${esistente.descrizione})`, modello: esistente }, { status: 409 });

  const modello = await prisma.modello.create({
    data: { codice, descrizione, categoria, fascia, note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null },
  });
  return NextResponse.json(modello, { status: 201 });
}
