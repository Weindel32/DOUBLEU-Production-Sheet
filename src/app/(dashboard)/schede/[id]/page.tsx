export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SchedaDetail from "@/components/scheda/SchedaDetail";

export default async function SchedaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });

  if (!scheda) notFound();

  const [clienti, loghi, materiali] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.logo.findMany({ orderBy: { nome: "asc" } }),
    prisma.materiale.findMany({ orderBy: { nome: "asc" } }),
  ]);

  const schedaData = {
    ...scheda,
    collezione: scheda.collezione ?? undefined,
    clienteId: scheda.clienteId ?? undefined,
    categoria: scheda.categoria ?? undefined,
    vestibilita: scheda.vestibilita ?? undefined,
    genere: scheda.genere ?? undefined,
    stagione: scheda.stagione ?? undefined,
    utilizzo: scheda.utilizzo ?? undefined,
    tessutoPrincipale: scheda.tessutoPrincipale ?? undefined,
    pesoTessuto: scheda.pesoTessuto ?? undefined,
    altezzaTessuto: scheda.altezzaTessuto ?? undefined,
    tessutoSecondario: scheda.tessutoSecondario ?? undefined,
    pesoTessutoSecondario: scheda.pesoTessutoSecondario ?? undefined,
    coloreBase: scheda.coloreBase ?? undefined,
    coloriSecondari: scheda.coloriSecondari ?? undefined,
    collo: scheda.collo ?? undefined,
    maniche: scheda.maniche ?? undefined,
    noteSpecifiche: scheda.noteSpecifiche ?? undefined,
    notePersonalizzazione: scheda.notePersonalizzazione ?? undefined,
    colorePrincipale: scheda.colorePrincipale ?? undefined,
    coloreSecondario: scheda.coloreSecondario ?? undefined,
    noteProduzione: scheda.noteProduzione ?? undefined,
    tolleranzaTaglio: scheda.tolleranzaTaglio ?? undefined,
    tolleranzaCucitura: scheda.tolleranzaCucitura ?? undefined,
    tolleranzaColore: scheda.tolleranzaColore ?? undefined,
    tolleranzaStampa: scheda.tolleranzaStampa ?? undefined,
    controlloQualita: scheda.controlloQualita ?? undefined,
    packaging: scheda.packaging ?? undefined,
    costoLavorazione: scheda.costoLavorazione ?? undefined,
    costoTaglio: scheda.costoTaglio ?? undefined,
    costoCucitura: scheda.costoCucitura ?? undefined,
    costoStampa: scheda.costoStampa ?? undefined,
    costoRicamo: scheda.costoRicamo ?? undefined,
    prezzoVendita: scheda.prezzoVendita ?? undefined,
    noteRapide: scheda.noteRapide ?? undefined,
    immagini: scheda.immagini ? JSON.parse(scheda.immagini) : [],
    tabellaMisure: scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {},
    quantitaTaglia: scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {},
    allegati: scheda.allegati ? JSON.parse(scheda.allegati) : [],
    consumoMateriale: scheda.consumoMateriale ? JSON.parse(scheda.consumoMateriale) : [],
    createdAt: scheda.createdAt.toISOString(),
    updatedAt: scheda.updatedAt.toISOString(),
  };

  return (
    <SchedaDetail
      scheda={schedaData}
      clientiDisponibili={clienti}
      loghiDisponibili={loghi}
      materialiDisponibili={materiali}
    />
  );
}
