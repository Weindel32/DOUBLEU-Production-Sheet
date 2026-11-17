import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ordiniOrderApp } from "@/lib/orderApp";
import { statoReferenza } from "@/lib/referenze";
import { chiaveOrderApp, confrontaSchede, nuovoOrdine } from "@/lib/ordineSchede";
import { TIPI_COSTO_DB } from "@/lib/utils";

/**
 * Salva l'ordine delle schede di un ordine dopo un trascinamento ({ ids } nel nuovo ordine).
 * Tutte le schede dell'ordine prendono una posizione, così quelle create dopo vanno in fondo.
 * Solo Production Sheet: l'ordine nell'Order App non cambia.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string") : null;
  if (!ids || ids.length === 0) return NextResponse.json({ error: "Elenco non valido" }, { status: 400 });

  const [schede, ordini] = await Promise.all([
    prisma.scheda.findMany({
      where: { ordineOrderAppId: id, tipo: { notIn: TIPI_COSTO_DB } },
      select: { id: true, posizione: true, nomeArticolo: true, articoloOrderAppId: true, firmaOrderApp: true, genere: true },
    }),
    ordiniOrderApp(),
  ]);
  const referenze = ordini.find((o) => o.id === id)?.referenze ?? null;
  const attuale = schede
    .map((s) => ({ id: s.id, k: { posizione: s.posizione, orderApp: chiaveOrderApp(statoReferenza(s, referenze), referenze), nome: s.nomeArticolo } }))
    .sort((a, b) => confrontaSchede(a.k, b.k))
    .map((s) => s.id);
  const ordine = nuovoOrdine(attuale, ids);

  // SQL diretto: con prisma.update cambierebbe "aggiornata il" di tutte le schede, che invece non sono state modificate.
  await prisma.$executeRaw`
    UPDATE "Scheda" AS s SET "posizione" = v.pos
    FROM unnest(${ordine}::text[], ${ordine.map((_, i) => i)}::int[]) AS v(id, pos)
    WHERE s."id" = v.id`;
  return NextResponse.json({ ordine });
}
