import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/** Piano di produzione di un ordine: giorni lavorativi e, se serve, il primo giorno scritto a mano. Vuoto = predefinito. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const giorni = body.giorniProduzione === null || body.giorniProduzione === "" ? null : Number(body.giorniProduzione);
  if (giorni !== null && (!Number.isInteger(giorni) || giorni < 1 || giorni > 365))
    return NextResponse.json({ error: "I giorni di produzione vanno da 1 a 365" }, { status: 400 });
  const inizio = typeof body.inizioProduzione === "string" && body.inizioProduzione ? body.inizioProduzione : null;
  if (inizio && !/^\d{4}-\d{2}-\d{2}$/.test(inizio))
    return NextResponse.json({ error: "Data di inizio non valida" }, { status: 400 });

  const piano = await prisma.pianoOrdine.upsert({
    where: { ordineOrderAppId: id },
    create: { ordineOrderAppId: id, giorniProduzione: giorni, inizioProduzione: inizio },
    update: { giorniProduzione: giorni, inizioProduzione: inizio },
  });
  return NextResponse.json(piano);
}
