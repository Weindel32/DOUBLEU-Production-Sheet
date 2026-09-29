import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { normalizzaTipo } from "@/lib/utils";
import { generaCodice } from "@/lib/codici";

export async function GET() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  return NextResponse.json(schede);
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const codiceManuale = typeof body.codice === "string" ? body.codice.trim() : "";
    if (codiceManuale) {
      const esistente = await prisma.scheda.findUnique({ where: { codice: codiceManuale } });
      if (esistente)
        return NextResponse.json({ error: `Il codice ${codiceManuale} è già usato da un'altra scheda` }, { status: 409 });
    }
    const codice = codiceManuale || await generaCodice(body.categoria || "Altro");
    const scheda = await prisma.scheda.create({
      data: {
        codice,
        nomeArticolo: body.nomeArticolo,
        stato: body.stato || "bozza",
        tipo: normalizzaTipo(body.tipo),
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
        altezzaTessuto: body.altezzaTessuto,
        modellista: body.modellista,
        fornitoreTessuto: body.fornitoreTessuto,
        produttore: body.produttore,
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
        accessori: body.accessori ? JSON.stringify(body.accessori) : null,
        costoLavorazione: body.costoLavorazione,
        costoTaglio: body.costoTaglio,
        costoCucitura: body.costoCucitura,
        costoStampa: body.costoStampa,
        costoRicamo: body.costoRicamo,
        prezzoVendita: body.prezzoVendita,
        noteRapide: body.noteRapide,
      },
      include: { cliente: true },
    });
    return NextResponse.json(scheda, { status: 201 });
  } catch (error) {
    console.error("Errore creazione scheda:", error);
    return NextResponse.json({ error: "Errore nella creazione della scheda." }, { status: 500 });
  }
}
