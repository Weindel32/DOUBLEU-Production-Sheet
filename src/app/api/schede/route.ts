import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  return NextResponse.json(schede);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const scheda = await prisma.scheda.create({
    data: {
      codice: body.codice,
      nomeArticolo: body.nomeArticolo,
      stato: body.stato || "bozza",
      versione: body.versione || "1.0",
      collezione: body.collezione,
      clienteId: body.clienteId || null,
      categoria: body.categoria,
      vestibilita: body.vestibilita,
      genere: body.genere,
      stagione: body.stagione,
      utilizzo: body.utilizzo,
      tessutoPrincipale: body.tessutoPrincipale,
      pesoTessuto: body.pesoTessuto,
      coloreBase: body.coloreBase,
      coloriSecondari: body.coloriSecondari,
      collo: body.collo,
      maniche: body.maniche,
      noteSpecifiche: body.noteSpecifiche,
      notePersonalizzazione: body.notePersonalizzazione,
      colorePrincipale: body.colorePrincipale,
      coloreSecondario: body.coloreSecondario,
      tabellaMisure: body.tabellaMisure ? JSON.stringify(body.tabellaMisure) : null,
      quantitaTaglia: body.quantitaTaglia ? JSON.stringify(body.quantitaTaglia) : null,
      noteProduzione: body.noteProduzione,
      tolleranzaTaglio: body.tolleranzaTaglio,
      tolleranzaCucitura: body.tolleranzaCucitura,
      tolleranzaColore: body.tolleranzaColore,
      tolleranzaStampa: body.tolleranzaStampa,
      controlloQualita: body.controlloQualita,
      packaging: body.packaging,
      allegati: body.allegati ? JSON.stringify(body.allegati) : null,
      consumoMateriale: body.consumoMateriale ? JSON.stringify(body.consumoMateriale) : null,
      costoLavorazione: body.costoLavorazione,
      prezzoVendita: body.prezzoVendita,
      noteRapide: body.noteRapide,
    },
    include: { cliente: true },
  });
  return NextResponse.json(scheda, { status: 201 });
}
