import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generaCodice } from "@/lib/codici";
import { normalizzaTipo } from "@/lib/utils";

/**
 * Copia una scheda leggendo lo stato salvato sul database (non quello del browser).
 * - modo "ordine": da un articolo di costo nasce un ordine di produzione collegato (origineId);
 *   l'articolo resta nel catalogo costi.
 * - modo "duplica": copia dello stesso tipo, con "(copia)" nel nome.
 * I campioni non si copiano mai: sono il costo di sviluppo dell'articolo originale.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { modo } = await req.json().catch(() => ({ modo: "duplica" }));
  if (modo !== "ordine" && modo !== "duplica")
    return NextResponse.json({ error: "Modo non valido" }, { status: 400 });

  const origine = await prisma.scheda.findUnique({ where: { id }, include: { loghi: true } });
  if (!origine) return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
  if (modo === "ordine" && normalizzaTipo(origine.tipo) !== "costo")
    return NextResponse.json({ error: "Gli ordini si creano da un articolo di costo" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, codice: _codice, createdAt: _c, updatedAt: _u, stato: _s, campioni: _camp, loghi, ...campi } = origine;

  try {
    const nuova = await prisma.scheda.create({
      data: {
        ...campi,
        codice: await generaCodice(origine.categoria || "Altro"),
        stato: "bozza",
        versione: "1.0",
        tipo: modo === "ordine" ? "produzione" : normalizzaTipo(origine.tipo),
        origineId: modo === "ordine" ? origine.id : origine.origineId,
        nomeArticolo: modo === "duplica" ? `${origine.nomeArticolo} (copia)` : origine.nomeArticolo,
        campioni: null,
        loghi: {
          create: loghi.map((l) => ({
            logoId: l.logoId, posizione: l.posizione, tecnica: l.tecnica, dimensione: l.dimensione, note: l.note,
          })),
        },
      },
    });
    return NextResponse.json({ id: nuova.id, tipo: nuova.tipo }, { status: 201 });
  } catch (error) {
    console.error("Errore copia scheda:", error);
    return NextResponse.json({ error: "Copia non riuscita" }, { status: 500 });
  }
}
