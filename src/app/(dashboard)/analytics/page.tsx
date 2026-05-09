export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";

export interface ArticoloStats {
  codice: string;
  nomeArticolo: string;
  genere: string;
  totalePezzi: number;
}

export interface AnalyticsData {
  articoli: ArticoloStats[];
  taglie: {
    tutti: Record<string, number>;
    uomo: Record<string, number>;
    donna: Record<string, number>;
    junior: Record<string, number>;
    unisex: Record<string, number>;
  };
  totali: {
    totPezzi: number;
    totSchede: number;
    perGenere: Record<string, number>;
  };
}

function parseCodiceArticolo(nomeArticolo: string): { codice: string; nome: string } {
  const sepIndex = nomeArticolo.indexOf(" – ");
  if (sepIndex !== -1) {
    return {
      codice: nomeArticolo.slice(0, sepIndex).trim(),
      nome: nomeArticolo.slice(sepIndex + 3).trim(),
    };
  }
  return { codice: nomeArticolo, nome: nomeArticolo };
}

export default async function AnalyticsPage() {
  const schede = await prisma.scheda.findMany({
    where: { stato: "esecutiva" },
    select: {
      nomeArticolo: true,
      genere: true,
      quantitaTaglia: true,
    },
  });

  const articoliMap = new Map<string, ArticoloStats>();
  const taglieMap: AnalyticsData["taglie"] = {
    tutti: {},
    uomo: {},
    donna: {},
    junior: {},
    unisex: {},
  };

  for (const scheda of schede) {
    const qt: Record<string, number> = scheda.quantitaTaglia
      ? JSON.parse(scheda.quantitaTaglia)
      : {};

    const totalePezzi = Object.values(qt).reduce((s, q) => s + (Number(q) || 0), 0);
    const genereNorm = (scheda.genere || "").toLowerCase() as keyof typeof taglieMap;
    const { codice, nome } = parseCodiceArticolo(scheda.nomeArticolo);

    const existing = articoliMap.get(codice);
    if (existing) {
      existing.totalePezzi += totalePezzi;
    } else {
      articoliMap.set(codice, {
        codice,
        nomeArticolo: nome,
        genere: scheda.genere || "—",
        totalePezzi,
      });
    }

    for (const [taglia, qty] of Object.entries(qt)) {
      const q = Number(qty) || 0;
      if (!q) continue;
      taglieMap.tutti[taglia] = (taglieMap.tutti[taglia] || 0) + q;
      if (genereNorm in taglieMap) {
        (taglieMap[genereNorm] as Record<string, number>)[taglia] =
          ((taglieMap[genereNorm] as Record<string, number>)[taglia] || 0) + q;
      }
    }
  }

  const articoli = Array.from(articoliMap.values()).sort(
    (a, b) => b.totalePezzi - a.totalePezzi
  );

  const totPezzi = articoli.reduce((s, a) => s + a.totalePezzi, 0);
  const totali: AnalyticsData["totali"] = {
    totPezzi,
    totSchede: schede.length,
    perGenere: {
      uomo: articoli
        .filter((a) => a.genere.toLowerCase() === "uomo")
        .reduce((s, a) => s + a.totalePezzi, 0),
      donna: articoli
        .filter((a) => a.genere.toLowerCase() === "donna")
        .reduce((s, a) => s + a.totalePezzi, 0),
      junior: articoli
        .filter((a) => a.genere.toLowerCase() === "junior")
        .reduce((s, a) => s + a.totalePezzi, 0),
      unisex: articoli
        .filter((a) => a.genere.toLowerCase() === "unisex")
        .reduce((s, a) => s + a.totalePezzi, 0),
    },
  };

  return <AnalyticsClient articoli={articoli} taglie={taglieMap} totali={totali} />;
}
