import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { salvaTempiProduzione, TAG_ORDER_APP } from "@/lib/orderApp";

/** Tempi di produzione di un ordine, salvati nell'Order App: giorni lavorativi e inizio a mano. Vuoto = predefinito. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const giorni = body.giorniProduzione === null || body.giorniProduzione === "" ? null : Number(body.giorniProduzione);
  if (giorni !== null && (!Number.isInteger(giorni) || giorni < 1 || giorni > 365))
    return NextResponse.json({ error: "I giorni di produzione vanno da 1 a 365" }, { status: 400 });
  const inizio = typeof body.inizioProduzione === "string" && body.inizioProduzione ? body.inizioProduzione : null;
  if (inizio && !/^\d{4}-\d{2}-\d{2}$/.test(inizio))
    return NextResponse.json({ error: "Data di inizio non valida" }, { status: 400 });

  if (!(await salvaTempiProduzione(id, giorni, inizio)))
    return NextResponse.json({ error: "Order App non raggiungibile: tempi non salvati" }, { status: 502 });
  // Dati dell'Order App in cache per 5 minuti: si rileggono subito, la dashboard mostra i tempi nuovi.
  revalidateTag(TAG_ORDER_APP, { expire: 0 });
  return NextResponse.json({ giorniProduzione: giorni, inizioProduzione: inizio });
}
