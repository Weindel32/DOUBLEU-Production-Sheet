// Dashboard operativa: cosa c'è da fare adesso e cosa sta per scadere, ordine per ordine.
// Ordini "in lavorazione" = confermati o in produzione nell'Order App; i preventivi stanno a parte
// e non entrano né nei conteggi né nel tessuto da comprare.

import { prisma } from "@/lib/prisma";
import { ordiniOrderApp, type OrdineOrderApp } from "@/lib/orderApp";
import { riepilogoAcquisti } from "@/lib/approvvigionamento";
import { schedaAcquisto, etichettatoreColori } from "@/lib/approvvigionamentoServer";
import { salvaRicollegamenti } from "@/lib/clientiOrderApp";
import { statoReferenza, capiScheda, taglieDiverse, chiaveParte, parteCoperta, partiReferenza } from "@/lib/referenze";
import { nomeReferenza } from "@/lib/orderApp";
import { riepilogoScheda } from "@/lib/costiScheda";
import { MARGINE_MINIMO, TIPI_COSTO_DB } from "@/lib/utils";
import { pianoProduzione } from "@/lib/produzione";

const STATI_ATTIVI = ["CONFERMATO", "IN PRODUZIONE"];
/** Preavviso quando l'ordine non ne indica uno. */
const PREAVVISO_DEFAULT = 7;

function parseJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

/** Giorni da oggi alla consegna (gg/mm/aaaa); negativo se passata, null se manca. */
export function giorniAllaConsegna(data: string | null, oggi = new Date()) {
  const m = data?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const consegna = Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const inizio = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  return Math.round((consegna - inizio) / 86_400_000);
}

export type Urgenza = "scaduto" | "preavviso" | "ok" | "senza-data";

export interface AzioneDaFare {
  tipo: "senza-scheda" | "da-collegare" | "orfana" | "taglie" | "consumi" | "prezzo" | "materiale" | "ritardo";
  testo: string;
  dettaglio: string;
  href: string;
  urgenza: Urgenza;
}

export async function datiDashboard() {
  const [ordini, schedeRows, materiali, voci, piani] = await Promise.all([
    ordiniOrderApp(),
    prisma.scheda.findMany({ where: { tipo: { notIn: TIPI_COSTO_DB } }, orderBy: { updatedAt: "desc" } }),
    prisma.materiale.findMany(),
    prisma.coloreFornitore.findMany(),
    prisma.pianoOrdine.findMany(),
  ]);
  const pianoDi = new Map(piani.map((p) => [p.ordineOrderAppId, p]));

  const attivi = ordini
    .filter((o) => !o.perso && STATI_ATTIVI.includes(o.stato ?? ""))
    .map((o) => ({ o, giorni: giorniAllaConsegna(o.consegna) }))
    // Prima chi consegna prima; senza data in fondo.
    .sort((a, b) => (a.giorni ?? Infinity) - (b.giorni ?? Infinity));
  const preventivi = ordini.filter((o) => !o.perso && o.stato === "PREVENTIVO");
  const attiviIds = new Set(attivi.map((a) => a.o.id));

  const azioni: AzioneDaFare[] = [];
  const ricollegamenti: Parameters<typeof salvaRicollegamenti>[0] = [];
  const schedeAttive: { s: (typeof schedeRows)[number]; ordine: OrdineOrderApp }[] = [];

  const ordiniVista = attivi.map(({ o, giorni }) => {
    const preavviso = o.preavviso ?? PREAVVISO_DEFAULT;
    const urgenza: Urgenza = giorni === null ? "senza-data" : giorni < 0 ? "scaduto" : giorni <= preavviso ? "preavviso" : "ok";
    const mie = schedeRows.filter((s) => s.ordineOrderAppId === o.id);
    const conStato = mie.map((s) => ({ s, ref: statoReferenza(s, o.referenze) }));
    ricollegamenti.push(...conStato.map(({ s, ref }) => ({ id: s.id, stato: ref })));
    const valide = conStato.filter((x) => x.ref.tipo !== "non-piu-nell-ordine");
    valide.forEach(({ s }) => schedeAttive.push({ s, ordine: o }));

    // Una scheda per parte di referenza: adulto, e bambino quando ci sono taglie bambino.
    const chiavi = conStato.flatMap(({ s, ref }) => ref.tipo === "collegata" ? [chiaveParte(s.articoloOrderAppId!, ref.parte)] : []);
    const necessarie = o.referenze.flatMap((r) => partiReferenza(r).map((p) => ({ r, p })));
    const scoperte = necessarie.filter(({ r, p }) => !parteCoperta(r, p, chiavi));
    const daCollegare = conStato.filter((x) => x.ref.tipo === "da-collegare");
    const orfane = conStato.filter((x) => x.ref.tipo === "non-piu-nell-ordine");
    // Bambino mancante accanto a un adulto già fatto: si crea dalla scheda adulto, che ha il pulsante.
    const bambiniDaFare = scoperte.flatMap(({ r, p }) => {
      const adulto = p === "bambino" ? conStato.find(({ s, ref }) => ref.tipo === "collegata" && ref.parte === "adulto" && r.ids.includes(s.articoloOrderAppId!)) : undefined;
      return adulto ? [{ r, adulto: adulto.s }] : [];
    });
    // Le schede non ancora collegate coprono probabilmente qualcosa: non le conto come mancanti.
    const senzaScheda = Math.max(0, scoperte.length - bambiniDaFare.length - daCollegare.length);
    const conTaglie = necessarie.filter(({ r }) => r.taglie).length;
    const provvisorio = valide.some(({ s, ref }) => capiScheda(parseJson(s.quantitaTaglia, {}), ref.tipo === "collegata" ? ref.referenza : null).stimati);
    const capi = o.referenze.reduce((t, r) => t + (r.capi ?? 0), 0);
    const chi = `${o.cliente} · ${o.id}`;

    if (senzaScheda > 0)
      azioni.push({ tipo: "senza-scheda", testo: `${senzaScheda} ${senzaScheda === 1 ? "referenza" : "referenze"} senza scheda`, dettaglio: chi, href: `/schede/nuova?ordine=${encodeURIComponent(o.id)}`, urgenza });
    for (const { r, adulto } of bambiniDaFare)
      azioni.push({ tipo: "senza-scheda", testo: `Manca la scheda Bambino di ${nomeReferenza(r) || adulto.nomeArticolo}`, dettaglio: chi, href: `/schede/${adulto.id}`, urgenza });
    for (const { s } of daCollegare)
      azioni.push({ tipo: "da-collegare", testo: `Collega ${s.nomeArticolo} alla sua referenza`, dettaglio: chi, href: `/schede/${s.id}`, urgenza });
    for (const { s } of orfane)
      azioni.push({ tipo: "orfana", testo: `${s.nomeArticolo} non è più nell'ordine`, dettaglio: chi, href: `/schede/${s.id}`, urgenza });
    for (const { s, ref } of valide) {
      if (ref.tipo === "collegata" && ref.referenza.taglie && taglieDiverse(parseJson(s.quantitaTaglia, {}), ref.referenza.taglie))
        azioni.push({ tipo: "taglie", testo: `Taglie arrivate per ${s.nomeArticolo}`, dettaglio: chi, href: `/schede/${s.id}`, urgenza });
      if (!parseJson<unknown[]>(s.consumoMateriale, []).length)
        azioni.push({ tipo: "consumi", testo: `${s.nomeArticolo}: mancano i consumi`, dettaglio: `${chi} · tessuto e costo non calcolabili`, href: `/schede/${s.id}#sez-costi`, urgenza });
      else if (!s.prezzoVendita)
        azioni.push({ tipo: "prezzo", testo: `${s.nomeArticolo}: manca il prezzo di vendita`, dettaglio: `${chi} · margine non calcolabile`, href: `/schede/${s.id}#sez-costi`, urgenza });
    }

    // Tempi di produzione: dalla ricezione delle taglie (o dalla partenza scritta a mano) più i giorni lavorativi.
    const salvato = pianoDi.get(o.id);
    const produzione = pianoProduzione({
      ricezione: o.ricezioneTaglie, inizioManuale: salvato?.inizioProduzione ?? null,
      giorni: salvato?.giorniProduzione ?? null, consegna: o.consegna,
    });
    if (produzione.ritardo !== null && produzione.ritardo > 0)
      azioni.push({ tipo: "ritardo", testo: `Pronto ${produzione.ritardo} ${produzione.ritardo === 1 ? "giorno" : "giorni"} dopo la consegna promessa`, dettaglio: chi, href: "/dashboard#ordini", urgenza: urgenza === "ok" || urgenza === "senza-data" ? "preavviso" : urgenza });

    return {
      id: o.id, cliente: o.cliente, stato: o.stato, consegna: o.consegna, giorni, preavviso, urgenza, produzione,
      referenze: necessarie.length, coperte: necessarie.length - scoperte.length + Math.min(daCollegare.length, scoperte.length), senzaScheda: senzaScheda + bambiniDaFare.length,
      esecutive: valide.filter(({ s }) => s.stato === "esecutiva").length,
      bozze: valide.filter(({ s }) => s.stato !== "esecutiva").length,
      conTaglie, provvisorio, capi, orfane: orfane.length,
    };
  });

  await salvaRicollegamenti(ricollegamenti);

  // Tessuto su tutti gli ordini in lavorazione: stesso calcolo della pagina Acquisti, sommato.
  const acquisti = riepilogoAcquisti(schedeAttive.map(({ s, ordine }) => schedaAcquisto(s, ordine)), materiali);
  const etichetta = etichettatoreColori(materiali, voci);
  const tessuto = {
    ...acquisti,
    fornitori: acquisti.fornitori.map((g) => ({ ...g, righe: g.righe.map(etichetta) })),
    provvisorio: acquisti.referenze.some((d) => d.stimati),
  };
  // Materiali che impediscono il conto: dove intervenire nell'anagrafica.
  const visti = new Set<string>();
  for (const r of tessuto.fornitori.flatMap((g) => g.righe)) {
    if (visti.has(r.materiale.id) || (r.acquisto && r.acquisto.stima != null)) continue;
    visti.add(r.materiale.id);
    azioni.push({
      tipo: "materiale",
      testo: `${r.materiale.nome}: ${!r.acquisto ? "mancano peso e altezza" : "manca il prezzo"}`,
      dettaglio: !r.acquisto ? "servono per passare da metri a kg" : "la stima d'acquisto lo esclude",
      href: `/materiali/${r.materiale.id}/modifica`,
      urgenza: "ok",
    });
  }
  const pesoUrgenza: Record<Urgenza, number> = { scaduto: 0, preavviso: 1, ok: 2, "senza-data": 3 };
  azioni.sort((a, b) => pesoUrgenza[a.urgenza] - pesoUrgenza[b.urgenza]);

  // Margini sotto il minimo: schede degli ordini in lavorazione e schede non ancora legate a un ordine.
  const margini = schedeRows
    .filter((s) => (s.ordineOrderAppId ? attiviIds.has(s.ordineOrderAppId) : true))
    .map((s) => {
      const r = riepilogoScheda(s, materiali);
      const ordine = s.ordineOrderAppId ? ordini.find((o) => o.id === s.ordineOrderAppId) : undefined;
      return { id: s.id, nome: s.nomeArticolo, codice: s.codiceModello || s.codice, cliente: ordine?.cliente ?? null, ordine: s.ordineOrderAppId, costo: r.totale, prezzo: r.prezzoVendita, margine: r.margine };
    })
    .filter((m) => m.margine !== null && m.margine < MARGINE_MINIMO)
    .sort((a, b) => a.margine! - b.margine!);

  return {
    ordini: ordiniVista,
    // Un preventivo senza schede porta a crearne una (già sull'ordine), non a un elenco vuoto.
    preventivi: preventivi.map((o) => ({
      id: o.id, cliente: o.cliente, data: o.data, referenze: o.referenze.length,
      schede: schedeRows.filter((s) => s.ordineOrderAppId === o.id).length,
    })),
    azioni,
    tessuto,
    margini,
    orderAppOk: ordini.length > 0,
  };
}

export type DatiDashboard = Awaited<ReturnType<typeof datiDashboard>>;
