import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { datiOrdine, firmaArticoloOrdine } from "@/lib/clientiOrderApp";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  if (!scheda) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  return NextResponse.json(scheda);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = { ...body };
  // Nessun cliente = null: "" non esiste tra i clienti e il vincolo farebbe fallire l'aggiornamento.
  if (data.clienteId === "") data.clienteId = null;
  // Scegliere l'ordine dell'Order App assegna anche il suo cliente; togliere l'ordine lascia il cliente.
  if (body.ordineOrderAppId !== undefined) {
    const ordine = await datiOrdine(body.ordineOrderAppId || null);
    if ("error" in ordine) return NextResponse.json({ error: ordine.error }, { status: 400 });
    Object.assign(data, ordine);
    // Cambiando ordine la referenza di prima non vale più, a meno che non arrivi insieme quella nuova.
    if (body.articoloOrderAppId === undefined) data.articoloOrderAppId = null;
  }
  // Il collegamento alla referenza porta con sé la firma dell'articolo (kit, descrizione, colore).
  if (data.articoloOrderAppId !== undefined) {
    const ordineId = data.ordineOrderAppId !== undefined
      ? data.ordineOrderAppId as string | null
      : (await prisma.scheda.findUnique({ where: { id }, select: { ordineOrderAppId: true } }))?.ordineOrderAppId;
    data.firmaOrderApp = await firmaArticoloOrdine(ordineId, data.articoloOrderAppId as string | null);
  }

  if (body.tabellaMisure !== undefined)
    data.tabellaMisure = body.tabellaMisure ? JSON.stringify(body.tabellaMisure) : null;
  if (body.quantitaTaglia !== undefined)
    data.quantitaTaglia = body.quantitaTaglia ? JSON.stringify(body.quantitaTaglia) : null;
  if (body.allegati !== undefined)
    data.allegati = body.allegati ? JSON.stringify(body.allegati) : null;
  if (body.consumoMateriale !== undefined)
    data.consumoMateriale = body.consumoMateriale ? JSON.stringify(body.consumoMateriale) : null;
  if (body.accessori !== undefined)
    data.accessori = body.accessori ? JSON.stringify(body.accessori) : null;
  if (body.immagini !== undefined)
    data.immagini = body.immagini ? JSON.stringify(body.immagini) : null;
  if (body.campioni !== undefined)
    data.campioni = body.campioni ? JSON.stringify(body.campioni) : null;

  if (data.tipo !== undefined && data.tipo !== "costo" && data.tipo !== "produzione")
    return NextResponse.json({ error: "Tipo scheda non valido" }, { status: 400 });

  try {
    const scheda = await prisma.scheda.update({
      where: { id },
      data,
      include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
    });
    return NextResponse.json(scheda);
  } catch (error) {
    // P2002: vincolo di unicità (il codice scelto è già di un'altra scheda)
    if ((error as { code?: string }).code === "P2002")
      return NextResponse.json({ error: `Il codice ${String(data.codice ?? "")} è già usato da un'altra scheda` }, { status: 409 });
    console.error("Errore salvataggio scheda:", error);
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scheda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
