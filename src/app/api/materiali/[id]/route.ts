import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { rigaCambioPrezzo, codiciJson } from "@/lib/materiali";
import { leggiCodici, leggiNomiTessuto, nomiTessutoJson } from "@/lib/colori";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const materiale = await prisma.materiale.findUnique({ where: { id } });
  if (!materiale) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(materiale);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const prima = await prisma.materiale.findUnique({ where: { id } });
  if (!prima) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  // Un cambio di prezzo di listino finisce da solo in cima alle note, con la data:
  // lo storico prezzi resta sul materiale senza doverlo scrivere a mano.
  const dopo = {
    unitaMisura: body.unitaMisura !== undefined ? body.unitaMisura : prima.unitaMisura,
    costoMetro: body.costoMetro !== undefined ? body.costoMetro : prima.costoMetro,
    prezzoKg: body.prezzoKg !== undefined ? body.prezzoKg : prima.prezzoKg,
  };
  const riga = rigaCambioPrezzo(prima, dopo);
  const noteBase = body.note !== undefined ? body.note : prima.note;
  const note = riga ? [riga, noteBase].filter(Boolean).join("\n") : noteBase;

  // I nomi propri del tessuto valgono solo per i codici che il tessuto ha ancora.
  const colori = body.colori !== undefined ? codiciJson(body.colori) : prima.colori;
  const coloriNomi = body.coloriNomi !== undefined || body.colori !== undefined
    ? nomiTessutoJson(body.coloriNomi !== undefined ? body.coloriNomi : leggiNomiTessuto(prima.coloriNomi), leggiCodici(colori))
    : undefined;

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
      prezzoKg: body.prezzoKg,
      codice: body.codice,
      foto: body.foto,
      colori: body.colori !== undefined ? colori : undefined,
      coloriNomi,
      cartellaFoto: body.cartellaFoto,
      cartellaData: body.cartellaData,
      note,
    },
  });
  return NextResponse.json(materiale);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.materiale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
