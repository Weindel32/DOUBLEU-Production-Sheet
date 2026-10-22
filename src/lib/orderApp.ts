// Clienti e ordini dell'Order App, letti in sola lettura dal suo database Supabase (API REST).
// Servono ORDER_APP_SUPABASE_URL e ORDER_APP_SUPABASE_KEY su Vercel; senza, gli elenchi sono vuoti
// e la Production Sheet funziona come prima con i suoi clienti.

import { giornoItaliano } from "@/lib/produzione";

export interface ClienteOrderApp { id: string; nome: string; citta: string | null; categoria: string | null }

/** Una referenza dell'ordine: un articolo di un kit (o lo stesso articolo ripetuto, unito). */
export interface ReferenzaOrderApp {
  id: string;
  /** Tutti gli articoli dell'Order App uniti in questa referenza: una scheda collegata a uno qualsiasi è di questa. */
  ids: string[];
  kit: string | null;
  categoria: string | null;
  descrizione: string | null;
  colore: string | null;
  /** Capi della referenza nell'ordine: somma delle taglie, o il totale indicato quando le taglie non ci sono ancora. */
  capi: number | null;
  /** Quantità per taglia come nella scheda (S, M… e 6A, 8A… per i bambini); null finché il club non le manda. */
  taglie: Record<string, number> | null;
  /** Le stesse taglie divise: adulto e bambino sono due prodotti, con due schede e due codici. */
  taglieAdulto: Record<string, number> | null;
  taglieBambino: Record<string, number> | null;
  /** Kit, descrizione e colore di ogni articolo unito: ritrovano la referenza se l'id cambia. */
  firme: string[];
}

type TaglieOrderApp = Record<string, number | null> | null;

/** Taglie dell'articolo: adulto così come sono, bambino "6" → "6A" come nella scheda; "__qty" è il totale senza taglie. */
function leggiTaglie(adulto: TaglieOrderApp, bambino: TaglieOrderApp) {
  const taglieAdulto: Record<string, number> = {};
  const taglieBambino: Record<string, number> = {};
  for (const [t, q] of Object.entries(adulto ?? {})) if (t !== "__qty" && q && q > 0) taglieAdulto[t] = q;
  for (const [t, q] of Object.entries(bambino ?? {})) if (t !== "__qty" && q && q > 0) taglieBambino[/^\d+$/.test(t) ? `${t}A` : t] = q;
  const taglie = { ...taglieAdulto, ...taglieBambino };
  const somma = sommaTaglie(taglie);
  const totale = (adulto?.__qty ?? 0) + (bambino?.__qty ?? 0);
  return {
    taglie: somma > 0 ? taglie : null,
    taglieAdulto: sommaTaglie(taglieAdulto) > 0 ? taglieAdulto : null,
    taglieBambino: sommaTaglie(taglieBambino) > 0 ? taglieBambino : null,
    capi: somma > 0 ? somma : totale > 0 ? totale : null,
  };
}

export const sommaTaglie = (t: Record<string, number> | null | undefined) => Object.values(t ?? {}).reduce((a, b) => a + b, 0);

/** Impronta di un articolo dell'ordine: kit, descrizione e colore, senza maiuscole e spazi ai bordi. */
export const firmaArticolo = (kit: string | null, descrizione: string | null, colore: string | null) =>
  [kit, descrizione, colore].map((v) => (v ?? "").trim().toLowerCase()).join("|");

/** Nome della referenza per la scheda: "Polo senza bottoni · Adulto" → "Polo senza bottoni". */
export const nomeReferenza = (r: { descrizione: string | null; categoria: string | null }) =>
  (r.descrizione ?? r.categoria ?? "").split(" · ")[0].trim();

/** La referenza di un ordine a cui è collegata una scheda (per uno qualsiasi dei suoi articoli). */
export const trovaReferenza = (referenze: ReferenzaOrderApp[], articoloId: string | null | undefined) =>
  articoloId ? referenze.find((r) => r.ids.includes(articoloId)) : undefined;

export interface OrdineOrderApp {
  id: string; // es. "DU-2026-1625"
  clienteId: string | null;
  cliente: string;
  data: string | null; // gg/mm/aaaa, come nell'Order App
  stato: string | null; // PREVENTIVO, CONFERMATO, IN PRODUZIONE, CONSEGNATO, ANNULLATO
  perso: boolean;
  /** Consegna prevista (gg/mm/aaaa) e giorni di preavviso impostati nell'Order App. */
  consegna: string | null;
  preavviso: number | null;
  /** Giorno (aaaa-mm-gg, ora italiana) in cui il club ha inviato le taglie dal modulo: da qui parte la produzione. */
  ricezioneTaglie: string | null;
  referenze: ReferenzaOrderApp[];
}

export const orderAppConfigurata = () => !!(process.env.ORDER_APP_SUPABASE_URL && process.env.ORDER_APP_SUPABASE_KEY);

async function leggi<T>(percorso: string): Promise<T[] | null> {
  const url = process.env.ORDER_APP_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.ORDER_APP_SUPABASE_KEY;
  if (!url || !key) return null;
  try {
    const headers: Record<string, string> = { apikey: key };
    // Le chiavi "legacy" sono JWT e vanno anche nell'Authorization; le nuove sb_secret_ no.
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${url}/rest/v1/${percorso}`, { headers, next: { revalidate: 300 } });
    if (!res.ok) {
      console.error("Order App: lettura non riuscita", percorso, res.status, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.error("Order App: lettura non riuscita", percorso, err);
    return null;
  }
}

export async function clientiOrderApp(): Promise<ClienteOrderApp[]> {
  const righe = await leggi<{ id: string; name: string; city: string | null; category: string | null }>(
    "clients?select=id,name,city,category&order=name.asc",
  );
  return (righe ?? []).map((r) => ({ id: r.id, nome: r.name.trim(), citta: r.city || null, categoria: r.category }));
}

/** gg/mm/aaaa → aaaammgg, per ordinare dal più recente. */
export const chiaveData = (d: string | null) => {
  const m = d?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}${m[2].padStart(2, "0")}${m[1].padStart(2, "0")}` : "";
};

function sommaInsieme(a: Record<string, number> | null, b: Record<string, number> | null) {
  if (!b) return a;
  const somma = { ...(a ?? {}) };
  for (const [t, q] of Object.entries(b)) somma[t] = (somma[t] ?? 0) + q;
  return somma;
}

/**
 * Lo stesso articolo ripetuto nell'ordine (es. due pantaloncini nello stesso kit, o in due kit)
 * è una sola referenza: una sola scheda di produzione. I kit in cui compare si elencano insieme.
 */
function unisciUguali(righe: ReferenzaOrderApp[]): ReferenzaOrderApp[] {
  const perChiave = new Map<string, ReferenzaOrderApp>();
  for (const r of righe) {
    const k = [r.descrizione ?? r.categoria, r.colore].map((v) => (v ?? "").trim().toLowerCase()).join("|");
    const prima = perChiave.get(k);
    if (!prima) {
      perChiave.set(k, {
        ...r, ids: [...r.ids], firme: [...r.firme],
        taglie: r.taglie && { ...r.taglie }, taglieAdulto: r.taglieAdulto && { ...r.taglieAdulto }, taglieBambino: r.taglieBambino && { ...r.taglieBambino },
      });
      continue;
    }
    if (r.kit && !(prima.kit ?? "").split(" · ").includes(r.kit)) prima.kit = prima.kit ? `${prima.kit} · ${r.kit}` : r.kit;
    // Due pantaloncini uguali nel kit sono il doppio dei capi: quantità e taglie si sommano.
    prima.ids.push(...r.ids);
    prima.firme.push(...r.firme);
    if (r.capi) prima.capi = (prima.capi ?? 0) + r.capi;
    prima.taglie = sommaInsieme(prima.taglie, r.taglie);
    prima.taglieAdulto = sommaInsieme(prima.taglieAdulto, r.taglieAdulto);
    prima.taglieBambino = sommaInsieme(prima.taglieBambino, r.taglieBambino);
  }
  return [...perChiave.values()];
}

/** Ordini dell'Order App con le loro referenze, dal più recente. Gli ordini persi restano: possono avere schede. */
export async function ordiniOrderApp(): Promise<OrdineOrderApp[]> {
  const [ordini, kits, articoli, moduli] = await Promise.all([
    leggi<{ id: string; client: string | null; client_id: string | null; date: string | null; status: string | null; lost: boolean | null; delivery_date: string | null; alert_days: number | null }>(
      "orders?select=id,client,client_id,date,status,lost,delivery_date,alert_days",
    ),
    leggi<{ id: string; order_id: string; name: string | null; position: number | null }>("kits?select=id,order_id,name,position"),
    leggi<{ id: string; kit_id: string; category: string | null; description: string | null; color: string | null; sizes_adult: TaglieOrderApp; sizes_kids: TaglieOrderApp }>(
      "articles?select=id,kit_id,category,description,color,sizes_adult,sizes_kids",
    ),
    leggi<{ order_id: string; submitted_at: string | null }>("order_forms?select=order_id,submitted_at&submitted_at=not.is.null"),
  ]);
  if (!ordini) return [];
  const kitPerOrdine = new Map<string, { id: string; name: string | null; position: number | null }[]>();
  for (const k of kits ?? []) kitPerOrdine.set(k.order_id, [...(kitPerOrdine.get(k.order_id) ?? []), k]);
  const articoliPerKit = new Map<string, NonNullable<typeof articoli>>();
  for (const a of articoli ?? []) articoliPerKit.set(a.kit_id, [...(articoliPerKit.get(a.kit_id) ?? []), a]);
  // Ultimo invio del modulo taglie: se il club le corregge, la produzione riparte da lì.
  const ricezione = new Map<string, string>();
  for (const m of moduli ?? []) {
    const prima = ricezione.get(m.order_id);
    if (m.submitted_at && (!prima || m.submitted_at > prima)) ricezione.set(m.order_id, m.submitted_at);
  }

  return ordini
    .map((o) => ({
      id: o.id,
      clienteId: o.client_id,
      cliente: (o.client ?? "").trim() || "Senza cliente",
      data: o.date,
      stato: o.status,
      perso: !!o.lost,
      consegna: o.delivery_date || null,
      preavviso: o.alert_days ?? null,
      ricezioneTaglie: ricezione.has(o.id) ? giornoItaliano(ricezione.get(o.id)!) : null,
      referenze: unisciUguali((kitPerOrdine.get(o.id) ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .flatMap((k) => (articoliPerKit.get(k.id) ?? []).map((a) => ({
          id: a.id, ids: [a.id], firme: [firmaArticolo(k.name, a.description, a.color)],
          kit: k.name, categoria: a.category, descrizione: a.description?.trim() || null, colore: a.color?.trim() || null,
          ...leggiTaglie(a.sizes_adult, a.sizes_kids),
        })))),
    }))
    .sort((a, b) => chiaveData(b.data).localeCompare(chiaveData(a.data)) || b.id.localeCompare(a.id));
}

/** Ordini su cui ha senso aprire nuove schede: non annullati né persi. */
export const ordineAttivo = (o: OrdineOrderApp) => !o.perso && o.stato !== "ANNULLATO";

/** Versione leggera per i componenti client: niente referenze. */
export type OrdineBreve = Omit<OrdineOrderApp, "referenze"> & { nReferenze: number };
export const ordineBreve = (o: OrdineOrderApp): OrdineBreve => {
  const { referenze, ...resto } = o;
  return { ...resto, nReferenze: referenze.length };
};
