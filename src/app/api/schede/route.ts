import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });
  return NextResponse.json(schede);
}

const CATEGORIA_PREFISSO: Record<string, string> = {
  "T-Shirt": "TS", "Felpa": "FE", "Hoodie": "HO", "Zip Hoodie": "ZH",
  "Sweatshirt": "SW", "Sweatpants": "SP", "Pantaloncino": "PN",
  "Pantaloni": "PT", "Polo": "PO", "Short": "SH", "Skirt": "SK",
  "Dress": "DR", "Canotta": "CA", "Tuta": "TU", "Giacca": "GI",
  "Gilet": "GL", "Cappello": "CP", "Calze": "CZ", "Altro": "AL",
};

async function generaCodice(categoria: string): Promise<string> {
  const now = new Date();
  const anno = String(now.getFullYear()).slice(-2);
  const mese = String(now.getMonth() + 1).padStart(2, "0");
  const prefisso = CATEGORIA_PREFISSO[categoria] || categoria.substring(0, 2).toUpperCase();
  const base = `${prefisso}-${anno}${mese}`;
  const count = await prisma.scheda.count({ where: { codice: { startsWith: base } } });
  const progressivo = String(count + 1).padStart(3, "0");
  return `${base}-${progressivo}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const codice = await generaCodice(body.categoria || "Altro");
  const scheda = await prisma.scheda.create({
    data: {
      codice,
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
