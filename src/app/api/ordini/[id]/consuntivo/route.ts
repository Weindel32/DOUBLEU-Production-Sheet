import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FASI_SPESA } from "@/lib/consuntivo";
import { leggiFasiComplete } from "@/lib/consuntivoServer";

/**
 * Chiude o riapre il consuntivo ({ chiuso }): chiuso = tutte le spese registrate, margine reale definitivo.
 * Oppure segna una fase completa ({ fase, completa }): da lì conta lo speso vero anche se sotto il previsto.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body.fase === "string" && typeof body.completa === "boolean") {
    if (!(FASI_SPESA as readonly string[]).includes(body.fase)) return NextResponse.json({ error: "Fase non valida" }, { status: 400 });
    const attuali = await leggiFasiComplete(id);
    if (attuali === null) return NextResponse.json({ error: "Database da aggiornare: applica la migrazione delle fasi complete" }, { status: 503 });
    const fasi = body.completa ? [...new Set([...attuali, body.fase])] : attuali.filter((f) => f !== body.fase);
    const fasiComplete = JSON.stringify(fasi);
    await prisma.consuntivoOrdine.upsert({
      where: { ordineOrderAppId: id },
      create: { ordineOrderAppId: id, fasiComplete },
      update: { fasiComplete },
      select: { ordineOrderAppId: true },
    });
    return NextResponse.json({ fasi });
  }

  const { chiuso } = body;
  if (typeof chiuso !== "boolean") return NextResponse.json({ error: "Valore non valido" }, { status: 400 });
  const chiusoIl = chiuso ? new Date() : null;
  await prisma.consuntivoOrdine.upsert({
    where: { ordineOrderAppId: id },
    create: { ordineOrderAppId: id, chiusoIl },
    update: { chiusoIl },
    select: { ordineOrderAppId: true },
  });
  return NextResponse.json({ chiusoIl });
}
