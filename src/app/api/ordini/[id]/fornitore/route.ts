import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { oggiItalia } from "@/lib/fasi";

/**
 * Spunta dell'ordine al fornitore ({ campo: "ordinato" | "arrivato", fatto }): la data è quella di oggi.
 * Arrivato senza ordinato segna anche ordinato; togliere ordinato toglie anche arrivato.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { campo, fatto } = body;
  if ((campo !== "ordinato" && campo !== "arrivato") || typeof fatto !== "boolean")
    return NextResponse.json({ error: "Valore non valido" }, { status: 400 });
  try {
    const attuale = await prisma.ordineFornitore.findUnique({ where: { ordineOrderAppId: id } });
    const oggi = oggiItalia();
    let ordinatoIl = attuale?.ordinatoIl ?? null;
    let arrivatoIl = attuale?.arrivatoIl ?? null;
    if (campo === "ordinato") {
      ordinatoIl = fatto ? ordinatoIl ?? oggi : null;
      if (!fatto) arrivatoIl = null;
    } else {
      arrivatoIl = fatto ? arrivatoIl ?? oggi : null;
      if (fatto && !ordinatoIl) ordinatoIl = oggi;
    }
    const r = await prisma.ordineFornitore.upsert({
      where: { ordineOrderAppId: id },
      create: { ordineOrderAppId: id, ordinatoIl, arrivatoIl },
      update: { ordinatoIl, arrivatoIl },
    });
    return NextResponse.json({ ordinatoIl: r.ordinatoIl, arrivatoIl: r.arrivatoIl });
  } catch (err) {
    console.error("Ordine fornitore non salvato", id, err);
    return NextResponse.json({ error: "Non salvato: il database va aggiornato (migrazione ordine fornitore)" }, { status: 503 });
  }
}
