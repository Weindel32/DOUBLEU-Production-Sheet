import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SchedaDetail, { type SchedaCollegata } from "@/components/scheda/SchedaDetail";
import { baseScheda, normalizzaTipo } from "@/lib/utils";

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/**
 * Pagina di una scheda, condivisa da /schede/[id] (ordini) e /articoli/[id] (articoli di costo).
 * Una scheda aperta dal percorso sbagliato viene reindirizzata al suo elenco.
 */
export default async function SchedaPagina({ id, percorso }: { id: string; percorso: "/schede" | "/articoli" }) {
  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });

  if (!scheda) notFound();
  const tipo = normalizzaTipo(scheda.tipo);
  if (baseScheda(tipo) !== percorso) redirect(`${baseScheda(tipo)}/${id}`);

  const [clienti, loghi, materiali, origineRow, ordiniRows, modelli, vociColori] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" } }),
    prisma.logo.findMany({ orderBy: { nome: "asc" } }),
    prisma.materiale.findMany({ orderBy: { nome: "asc" } }),
    scheda.origineId
      ? prisma.scheda.findUnique({ where: { id: scheda.origineId }, select: { id: true, codice: true, nomeArticolo: true, stato: true } })
      : null,
    tipo === "costo"
      ? prisma.scheda.findMany({
          where: { origineId: scheda.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, codice: true, nomeArticolo: true, stato: true, cliente: { select: { nome: true } } },
        })
      : [],
    prisma.modello.findMany({ orderBy: { codice: "asc" }, select: { codice: true, descrizione: true, categoria: true, fascia: true } }),
    prisma.coloreFornitore.findMany(),
  ]);

  const origine: SchedaCollegata | null = origineRow;
  const ordiniCollegati: SchedaCollegata[] = ordiniRows.map((o) => ({
    id: o.id, codice: o.codice, nomeArticolo: o.nomeArticolo, stato: o.stato, cliente: o.cliente?.nome ?? null,
  }));

  const n = <T,>(v: T | null) => v ?? undefined;
  const schedaData = {
    ...scheda,
    tipo,
    collezione: n(scheda.collezione),
    clienteId: n(scheda.clienteId),
    categoria: n(scheda.categoria),
    vestibilita: n(scheda.vestibilita),
    genere: n(scheda.genere),
    stagione: n(scheda.stagione),
    utilizzo: n(scheda.utilizzo),
    tessutoPrincipale: n(scheda.tessutoPrincipale),
    pesoTessuto: n(scheda.pesoTessuto),
    altezzaTessuto: n(scheda.altezzaTessuto),
    tessutoSecondario: n(scheda.tessutoSecondario),
    pesoTessutoSecondario: n(scheda.pesoTessutoSecondario),
    coloreBase: n(scheda.coloreBase),
    coloriSecondari: n(scheda.coloriSecondari),
    collo: n(scheda.collo),
    maniche: n(scheda.maniche),
    noteSpecifiche: n(scheda.noteSpecifiche),
    notePersonalizzazione: n(scheda.notePersonalizzazione),
    colorePrincipale: n(scheda.colorePrincipale),
    coloreSecondario: n(scheda.coloreSecondario),
    noteProduzione: n(scheda.noteProduzione),
    tolleranzaTaglio: n(scheda.tolleranzaTaglio),
    tolleranzaCucitura: n(scheda.tolleranzaCucitura),
    tolleranzaColore: n(scheda.tolleranzaColore),
    tolleranzaStampa: n(scheda.tolleranzaStampa),
    controlloQualita: n(scheda.controlloQualita),
    packaging: n(scheda.packaging),
    costoLavorazione: n(scheda.costoLavorazione),
    costoTaglio: n(scheda.costoTaglio),
    costoCucitura: n(scheda.costoCucitura),
    costoStampa: n(scheda.costoStampa),
    costoRicamo: n(scheda.costoRicamo),
    prezzoVendita: n(scheda.prezzoVendita),
    noteRapide: n(scheda.noteRapide),
    immagini: parseJson(scheda.immagini, []),
    tabellaMisure: parseJson(scheda.tabellaMisure, {}),
    quantitaTaglia: parseJson(scheda.quantitaTaglia, {}),
    allegati: parseJson(scheda.allegati, []),
    consumoMateriale: parseJson(scheda.consumoMateriale, []),
    accessori: parseJson(scheda.accessori, []),
    campioni: parseJson(scheda.campioni, []),
    createdAt: scheda.createdAt.toISOString(),
    updatedAt: scheda.updatedAt.toISOString(),
  };

  return (
    <SchedaDetail
      key={scheda.id}
      scheda={schedaData}
      clientiDisponibili={clienti}
      loghiDisponibili={loghi}
      materialiDisponibili={materiali}
      origine={origine}
      ordiniCollegati={ordiniCollegati}
      modelli={modelli}
      vociColori={vociColori}
    />
  );
}
