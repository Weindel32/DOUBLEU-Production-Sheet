import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leggiSpesa } from "@/lib/speseApi";

/** Nuova spesa reale dell'ordine. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const letta = leggiSpesa(await req.json().catch(() => ({})));
  if ("errore" in letta) return NextResponse.json({ error: letta.errore }, { status: 400 });
  const spesa = await prisma.spesaOrdine.create({ data: { ordineOrderAppId: id, ...letta.dati } });
  return NextResponse.json(spesa, { status: 201 });
}
