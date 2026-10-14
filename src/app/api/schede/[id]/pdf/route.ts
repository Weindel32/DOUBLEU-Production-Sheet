import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORIE_ELASTICO, calcolaCostoUnitarioConsumo, normalizzaTipo, totaleCampione, totaleSviluppo } from "@/lib/utils";
import type { ConsumoMateriale, Campione } from "@/types";
import { etichettaColore } from "@/lib/colori";
import { riferimentoColori } from "@/lib/coloriServer";
import { creaPdfScheda, type Coppia, type DatiSchedaPdf } from "@/lib/pdf/schedaPdf";

const PALETTE_HEX: Record<string, string> = {
  "Nero": "#000000", "Bianco": "#ffffff", "Grigio chiaro": "#d1d5db",
  "Grigio": "#6b7280", "Grigio scuro": "#374151", "Rosso": "#ef4444",
  "Rosso scuro": "#991b1b", "Bordeaux": "#7f1d1d", "Arancione": "#f97316",
  "Giallo": "#facc15", "Verde chiaro": "#86efac", "Verde": "#22c55e",
  "Verde scuro": "#15803d", "Verde militare": "#4d7c0f", "Azzurro": "#7dd3fc",
  "Turchese": "#06b6d4", "Blu cielo": "#38bdf8", "Blu royal": "#2563eb",
  "Blu navy": "#1e3a8a", "Blu notte": "#0f172a", "Viola": "#7c3aed",
  "Lilla": "#c4b5fd", "Rosa": "#f9a8d4", "Rosa scuro": "#ec4899",
  "Marrone": "#92400e", "Beige": "#fef9e7", "Oro": "#d97706", "Argento": "#9ca3af",
};
const hex = (nome: string) => PALETTE_HEX[nome] || (/^#[0-9a-fA-F]{6}$/.test(nome) ? nome : "#cccccc");

/** Colore principale + secondari (JSON con destinazione) come righe "colore → dove". */
function righeColori(principale: string | null, secondariRaw: string | null) {
  const righe: DatiSchedaPdf["colori"] = [];
  if (principale) righe.push({ colore: principale, hex: hex(principale), destinazione: "Colore principale" });
  if (secondariRaw) {
    try {
      const arr = JSON.parse(secondariRaw);
      if (Array.isArray(arr))
        for (const v of arr as { colore: string; destinazione: string; altroTesto?: string }[])
          righe.push({ colore: v.colore || "", hex: hex(v.colore || ""), destinazione: v.destinazione === "Altro" && v.altroTesto ? v.altroTesto : v.destinazione || "" });
    } catch {
      righe.push({ colore: secondariRaw, hex: hex(secondariRaw), destinazione: "" });
    }
  }
  return righe;
}

/** Solo JPEG e PNG entrano nel PDF: le altre immagini (o irraggiungibili) si saltano invece di far fallire tutto. */
async function immaginePdf(url: string): Promise<DatiSchedaPdf["immagini"][number] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    if (data[0] === 0xff && data[1] === 0xd8) return { data, format: "jpg" };
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return { data, format: "png" };
    return null;
  } catch {
    return null;
  }
}

const euro = (n: number) => "€ " + n.toFixed(2).replace(".", ",");
const num = (n: number) => String(n).replace(".", ",");
const dataIt = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d || "");

/**
 * PDF della scheda (file vero: su iPhone si condivide o stampa dal foglio di iOS).
 * ?tipo=tecnico per il produttore (niente costi); ?tipo=interno con costi, margine e campioni.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interno = req.nextUrl.searchParams.get("tipo") === "interno";

  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } } },
  });
  if (!scheda) return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });

  const tabellaMisure = scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {};
  const quantitaTaglia: Record<string, number> = scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {};
  const consumiSalvati: ConsumoMateriale[] = scheda.consumoMateriale ? JSON.parse(scheda.consumoMateriale) : [];
  const accessori: { nome: string; quantita: number; prezzoUnitario: number }[] = scheda.accessori ? JSON.parse(scheda.accessori) : [];
  const campioni: Campione[] = scheda.campioni ? JSON.parse(scheda.campioni) : [];
  const urlImmagini: string[] = scheda.immagini ? JSON.parse(scheda.immagini) : [];

  // Il costo unitario si ricalcola dal materiale attuale: quello salvato è una fotografia dell'ultimo salvataggio.
  // Il codice colore si legge col fornitore del tessuto principale: "Navy · CTA col. 100 Blu scuro".
  const [rif, materialiConsumo, immagini] = await Promise.all([
    riferimentoColori(scheda.tessutoPrincipale),
    prisma.materiale.findMany({ where: { id: { in: consumiSalvati.map((c) => c.materialeId) } } }),
    Promise.all(urlImmagini.map(immaginePdf)),
  ]);
  const consumi = consumiSalvati.map((c) => {
    const mat = materialiConsumo.find((m) => m.id === c.materialeId);
    return mat ? { ...c, costoUnitario: calcolaCostoUnitarioConsumo(mat) } : c;
  });
  const taglie = Object.keys(quantitaTaglia);
  const totalePezzi = Object.values(quantitaTaglia).reduce((t, q) => t + q, 0);
  const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
  const specsElastico = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;
  const valore = (t: string, k: string) => {
    const v = (tabellaMisure[t] as Record<string, number | undefined> | undefined)?.[k];
    return v ? num(v) : "—";
  };

  const costoMateriali = consumi.reduce((t, c) => t + c.consumoPerCapo * (c.costoUnitario || 0), 0);
  const costoAccessori = accessori.reduce((t, a) => t + (a.quantita || 0) * (a.prezzoUnitario || 0), 0);
  const costoTotale = costoMateriali + costoAccessori + (scheda.costoLavorazione || 0);
  const totaleCampioni = totaleSviluppo(campioni);

  const dati: DatiSchedaPdf = {
    interno,
    sopra: normalizzaTipo(scheda.tipo) === "costo" ? "Costo articolo" : "Scheda produzione",
    nome: scheda.nomeArticolo,
    esecutiva: scheda.stato === "esecutiva",
    testata: [
      ["Modello", scheda.codiceModello], ["Codice scheda", scheda.codice], ["Cliente / Club", scheda.cliente?.nome ?? "—"],
      ["Collezione", scheda.collezione || "—"], ["Data creazione", new Date(scheda.createdAt).toLocaleDateString("it-IT")], ["Versione", scheda.versione],
    ],
    immagini: immagini.filter((i): i is NonNullable<typeof i> => !!i),
    info: [["Categoria", scheda.categoria], ["Vestibilità", scheda.vestibilita], ["Genere", scheda.genere], ["Stagione", scheda.stagione], ["Utilizzo", scheda.utilizzo]],
    specifiche: [
      ["Tessuto principale", scheda.tessutoPrincipale], ["Peso tessuto", scheda.pesoTessuto], ["Altezza tessuto", scheda.altezzaTessuto],
      ["Costina", scheda.tessutoSecondario], ["Peso costina", scheda.pesoTessutoSecondario],
      ["Colore base", etichettaColore(scheda.coloreBase, scheda.coloreBaseCodice, rif.fornitore, rif.nomeFornitore(scheda.coloreBaseCodice))],
      ["Colori secondari articolo", etichettaColore(scheda.coloriSecondari, scheda.coloriSecondariCodice, rif.fornitore, rif.nomeFornitore(scheda.coloriSecondariCodice))],
      ["Collo", scheda.collo], ["Maniche", scheda.maniche],
    ],
    noteSpecifiche: scheda.noteSpecifiche,
    loghi: scheda.loghi.map((l) => ({ nome: l.logo.nome, tecnica: l.tecnica, posizione: l.posizione, dimensione: l.dimensione, note: l.note })),
    colori: righeColori(scheda.colorePrincipale, scheda.coloreSecondario),
    notePersonalizzazione: scheda.notePersonalizzazione,
    misure: taglie.length === 0 ? null : isElastico
      ? {
          titolo: "Elastico vita per taglia (cm)",
          specifiche: [
            ["Altezza elastico", specsElastico?.altezza ? `${specsElastico.altezza} cm` : null], ["Tipo", specsElastico?.tipo],
            ["Costruzione", specsElastico?.costruzione], ["Applicazione", specsElastico?.applicazione],
          ],
          colonne: ["Lunghezza elastico", "Altezza"],
          righe: taglie.map((t) => ({ taglia: t, valori: [valore(t, "lunghezzaElastico"), valore(t, "altezzaElastico")] })),
        }
      : {
          titolo: "Tabella misure (cm)",
          specifiche: [],
          colonne: ["Torace", "Lunghezza", "Spalla", "Lung. manica"],
          righe: taglie.map((t) => ({ taglia: t, valori: ["torace", "lunghezza", "spalla", "lungManica"].map((k) => valore(t, k)) })),
        },
    quantita: taglie.length ? { taglie: taglie.map((t) => ({ taglia: t, q: quantitaTaglia[t] || 0 })), totale: totalePezzi } : null,
    produzione: [
      ["Note generali", scheda.noteProduzione], ["Taglio", scheda.tolleranzaTaglio], ["Cucitura", scheda.tolleranzaCucitura],
      ["Colore", scheda.tolleranzaColore], ["Stampa / Ricamo", scheda.tolleranzaStampa],
      ["Controllo qualità", scheda.controlloQualita], ["Packaging", scheda.packaging],
    ],
    costi: interno && (consumi.length > 0 || accessori.length > 0 || scheda.costoLavorazione)
      ? {
          consumi: consumi.map((c) => ({
            nome: c.nomeM,
            testo: `${num(c.consumoPerCapo)} ${c.unita}/capo${c.costoUnitario ? ` × ${euro(c.costoUnitario)} = ${euro(c.consumoPerCapo * c.costoUnitario)}/capo` : ""}`,
          })),
          accessori: accessori.map((a) => ({ nome: a.nome || "Accessorio", testo: `${num(a.quantita)} pz × ${euro(a.prezzoUnitario)} = ${euro(a.quantita * a.prezzoUnitario)}/capo` })),
          righe: [
            ["Costo materiali/capo", euro(costoMateriali)],
            ...(accessori.length ? [["Costo accessori/capo", euro(costoAccessori)] as Coppia] : []),
            ["Costo lavorazione/capo", euro(scheda.costoLavorazione || 0)],
          ],
          totale: euro(costoTotale),
          dopo: [
            ...(totalePezzi > 0 ? [[`Costo totale ordine (${totalePezzi} pz)`, euro(costoTotale * totalePezzi)] as Coppia] : []),
            ...(scheda.prezzoVendita ? [["Prezzo vendita/capo", euro(scheda.prezzoVendita)] as Coppia] : []),
          ],
          margine: scheda.prezzoVendita
            ? { testo: `${(((scheda.prezzoVendita - costoTotale) / scheda.prezzoVendita) * 100).toFixed(1).replace(".", ",")}%`, positivo: scheda.prezzoVendita > costoTotale }
            : null,
        }
      : null,
    campioni: interno && campioni.length > 0
      ? {
          titolo: `Campioni e sviluppo — totale ${euro(totaleCampioni)}`,
          blocchi: campioni.map((c) => ({
            testa: [`${c.nome || "Campione"} · ${dataIt(c.data)}`, euro(totaleCampione(c))] as Coppia,
            voci: c.voci.map((v) => [v.descrizione || "Voce", euro(v.importo || 0)] as Coppia),
            note: c.note,
          })),
          totale: campioni.length > 1 ? euro(totaleCampioni) : null,
        }
      : null,
    piede: `Scheda ${interno ? "interna" : "tecnica"} · ${scheda.codice} · v${scheda.versione}`,
  };

  const pdf = await creaPdfScheda(dati);
  const nome = `${interno ? "Scheda interna" : "Scheda tecnica"} ${scheda.codice} ${scheda.nomeArticolo}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome.replace(/[^\w .-]/g, "")}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
