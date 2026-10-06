import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { codiciJson } from "@/lib/materiali";

export async function GET() {
  const materiali = await prisma.materiale.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(materiali);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.nome || !body.tipo)
    return NextResponse.json({ error: "Nome e tipo sono obbligatori" }, { status: 400 });
  const materiale = await prisma.materiale.create({
    data: {
      nome: body.nome, tipo: body.tipo, composizione: body.composizione,
      peso: body.peso, unitaPeso: body.unitaPeso, larghezza: body.larghezza, unitaMisura: body.unitaMisura,
      fornitore: body.fornitore, costoMetro: body.costoMetro, prezzoKg: body.prezzoKg, note: body.note,
      codice: body.codice || null, foto: body.foto || null,
      colori: codiciJson(body.colori), cartellaFoto: body.cartellaFoto || null, cartellaData: body.cartellaData || null,
    },
  });
  return NextResponse.json(materiale, { status: 201 });
}
