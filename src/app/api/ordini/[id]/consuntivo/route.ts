import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Chiude o riapre il consuntivo: chiuso = tutte le spese registrate, margine reale definitivo. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { chiuso } = await req.json().catch(() => ({}));
  if (typeof chiuso !== "boolean") return NextResponse.json({ error: "Valore non valido" }, { status: 400 });
  const chiusoIl = chiuso ? new Date() : null;
  await prisma.consuntivoOrdine.upsert({
    where: { ordineOrderAppId: id },
    create: { ordineOrderAppId: id, chiusoIl },
    update: { chiusoIl },
  });
  return NextResponse.json({ chiusoIl });
}
