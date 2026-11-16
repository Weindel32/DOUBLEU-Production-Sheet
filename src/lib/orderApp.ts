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

/**
 * Una riga di vendita dell'ordine: un kit (prezzi a kit) o un articolo (prezzi per articolo).
 * Il prezzo vive nell'Order App, non nella scheda: lo stesso articolo può stare in kit con prezzi diversi.
 */
export interface RigaVendita {
  tipo: "kit" | "articolo";
  nome: string;
  /** Kit o pezzi venduti (pagati). */
  quantita: number;
  /** Kit o pezzi consegnati in omaggio: costano ma non incassano. */
  omaggi: number;
  /** Prezzo unitario imponibile, IVA esclusa. */
  prezzo: number;
  /** Ricavo imponibile della riga, con il suo sconto e la sua quota dello sconto sull'ordine. */
  ricavo: number;
  /** Sconto non in percentuale sulla riga: non si sa come l'Order App lo applica, il ricavo è senza. */
  scontoDaVerificare: boolean;
  /** Articoli dell'Order App nella riga con i pezzi consegnati (omaggi compresi), per il costo. */
  articoli: { id: string; adulto: number; bambino: number }[];
}

/** Quanto incassa l'ordine, con le regole dell'Order App: imponibile merce, poi IVA e spedizione. */
export interface VenditaOrdine {
  modo: "kit" | "singolo";
  righe: RigaVendita[];
  /** Somma delle righe prima dello sconto sull'ordine. */
  subtotale: number;
  scontoOrdine: number;
  /** Ricavo dell'ordine per il margine: merce, IVA e spedizione escluse. */
  imponibile: number;
  spedizione: number;
  /** Aliquota IVA dell'ordine in %, 0 se senza IVA: serve a mostrare i prezzi come li pensi (IVA inclusa). */
  iva: number;
}

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
  /** Tempi di produzione salvati nell'ordine: giorni lavorativi (null = predefinito) e inizio a mano (aaaa-mm-gg). */
  giorniProduzione: number | null;
  inizioProduzione: string | null;
  referenze: ReferenzaOrderApp[];
  vendita: VenditaOrdine;
}

type Num = number | string | null;
const n = (v: Num | undefined) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);

type KitRiga = { id: string; order_id: string; name: string | null; position: number | null; price: Num; quantity: number | null; omaggio: Num; discount_type: string | null; discount_value: Num };
type ArticoloRiga = {
  id: string; kit_id: string; category: string | null; description: string | null; color: string | null;
  sizes_adult: TaglieOrderApp; sizes_kids: TaglieOrderApp; price: Num; omaggio: number | null; discount_type: string | null; discount_value: Num;
};
type OrdineRiga = {
  id: string; client: string | null; client_id: string | null; date: string | null; status: string | null; lost: boolean | null;
  delivery_date: string | null; alert_days: number | null; production_days: number | null; production_start: string | null;
  pricing_mode: string | null; kit_quantity: number | null; iva_enabled: boolean | null; iva_rate: Num; discount_mode: string | null; discount_type: string | null; discount_value: Num; shipping: Num;
};

/** Sconto di riga (kit o articolo): in percentuale si applica, altrimenti va verificato nell'Order App. */
function scontoRiga(lordo: number, tipo: string | null, valore: Num) {
  const v = n(valore);
  if (!v) return { ricavo: lordo, daVerificare: false };
  if (tipo === "percentuale") return { ricavo: lordo * (1 - v / 100), daVerificare: false };
  return { ricavo: lordo, daVerificare: true };
}

/** Pezzi di un articolo per parte: senza taglie il totale indicato va all'adulto, come per le referenze. */
function pezziArticolo(a: ArticoloRiga) {
  const t = leggiTaglie(a.sizes_adult, a.sizes_kids);
  const adulto = sommaTaglie(t.taglieAdulto);
  const bambino = sommaTaglie(t.taglieBambino);
  return adulto + bambino > 0 ? { adulto, bambino } : { adulto: t.capi ?? 0, bambino: 0 };
}

/**
 * Ricavo dell'ordine con le stesse regole dell'Order App (verificate sui totali): a kit prezzo × kit
 * venduti, per articolo prezzo × (pezzi − omaggi); poi lo sconto sull'ordine, ripartito sulle righe.
 */
export function venditaOrdine(o: OrdineRiga, kits: KitRiga[], articoliPerKit: Map<string, ArticoloRiga[]>): VenditaOrdine {
  const modo = o.pricing_mode === "kit" ? "kit" : "singolo";
  const ordinati = [...kits].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const righe: RigaVendita[] = modo === "kit"
    ? ordinati.map((k) => {
        const quantita = k.quantity ?? o.kit_quantity ?? 0;
        const prezzo = n(k.price);
        const { ricavo, daVerificare } = scontoRiga(prezzo * quantita, k.discount_type, k.discount_value);
        return {
          tipo: "kit", nome: k.name?.trim() || "Kit", quantita, omaggi: n(k.omaggio), prezzo, ricavo, scontoDaVerificare: daVerificare,
          articoli: (articoliPerKit.get(k.id) ?? []).map((a) => ({ id: a.id, ...pezziArticolo(a) })),
        };
      })
    : ordinati.flatMap((k) => (articoliPerKit.get(k.id) ?? []).map((a): RigaVendita => {
        const pz = pezziArticolo(a);
        const omaggi = Math.min(a.omaggio ?? 0, pz.adulto + pz.bambino);
        const quantita = pz.adulto + pz.bambino - omaggi;
        const prezzo = n(a.price);
        const { ricavo, daVerificare } = scontoRiga(prezzo * quantita, a.discount_type, a.discount_value);
        const nome = [a.description?.trim() || categoriaDaOrderApp(a.category) || "Articolo", a.color?.trim()].filter(Boolean).join(" · ");
        return { tipo: "articolo", nome, quantita, omaggi, prezzo, ricavo, scontoDaVerificare: daVerificare, articoli: [{ id: a.id, ...pz }] };
      }));
  const subtotale = righe.reduce((t, r) => t + r.ricavo, 0);
  const v = n(o.discount_value);
  const scontoOrdine = o.discount_mode === "ordine" && v
    ? Math.min(subtotale, o.discount_type === "percentuale" ? subtotale * v / 100 : v)
    : 0;
  if (scontoOrdine > 0 && subtotale > 0) for (const r of righe) r.ricavo *= 1 - scontoOrdine / subtotale;
  return { modo, righe, subtotale, scontoOrdine, imponibile: subtotale - scontoOrdine, spedizione: n(o.shipping), iva: o.iva_enabled ? n(o.iva_rate) : 0 };
}

/** Tag dei dati letti dall'Order App: dopo una scrittura si invalida per rileggerli subito. */
export const TAG_ORDER_APP = "order-app";

export const orderAppConfigurata = () => !!(process.env.ORDER_APP_SUPABASE_URL && process.env.ORDER_APP_SUPABASE_KEY);

async function leggi<T>(percorso: string): Promise<T[] | null> {
  const url = process.env.ORDER_APP_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.ORDER_APP_SUPABASE_KEY;
  if (!url || !key) return null;
  try {
    const headers: Record<string, string> = { apikey: key };
    // Le chiavi "legacy" sono JWT e vanno anche nell'Authorization; le nuove sb_secret_ no.
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${url}/rest/v1/${percorso}`, { headers, next: { revalidate: 300, tags: [TAG_ORDER_APP] } });
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

/**
 * Salva nell'ordine dell'Order App giorni di produzione e inizio a mano: è l'unica scrittura della
 * Production Sheet sull'Order App, così i tempi sono gli stessi nelle due app.
 */
export async function salvaTempiProduzione(ordineId: string, giorni: number | null, inizio: string | null) {
  const url = process.env.ORDER_APP_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.ORDER_APP_SUPABASE_KEY;
  if (!url || !key) return false;
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(ordineId)}`, {
    method: "PATCH", headers, body: JSON.stringify({ production_days: giorni, production_start: inizio }), cache: "no-store",
  }).catch((err) => { console.error("Order App: tempi di produzione non salvati", ordineId, err); return null; });
  if (!res?.ok) console.error("Order App: tempi di produzione non salvati", ordineId, res?.status, await res?.text().catch(() => ""));
  return !!res?.ok;
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
    leggi<OrdineRiga>(
      "orders?select=id,client,client_id,date,status,lost,delivery_date,alert_days,production_days,production_start,pricing_mode,kit_quantity,iva_enabled,iva_rate,discount_mode,discount_type,discount_value,shipping",
    ),
    leggi<KitRiga>("kits?select=id,order_id,name,position,price,quantity,omaggio,discount_type,discount_value"),
    leggi<ArticoloRiga>(
      "articles?select=id,kit_id,category,description,color,sizes_adult,sizes_kids,price,omaggio,discount_type,discount_value",
    ),
    leggi<{ order_id: string; submitted_at: string | null }>("order_forms?select=order_id,submitted_at&submitted_at=not.is.null"),
  ]);
  if (!ordini) return [];
  const kitPerOrdine = new Map<string, KitRiga[]>();
  for (const k of kits ?? []) kitPerOrdine.set(k.order_id, [...(kitPerOrdine.get(k.order_id) ?? []), k]);
  const articoliPerKit = new Map<string, ArticoloRiga[]>();
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
      giorniProduzione: o.production_days ?? null,
      inizioProduzione: o.production_start || null,
      vendita: venditaOrdine(o, kitPerOrdine.get(o.id) ?? [], articoliPerKit),
      referenze: unisciUguali([...(kitPerOrdine.get(o.id) ?? [])]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .flatMap((k) => (articoliPerKit.get(k.id) ?? []).map((a) => ({
          id: a.id, ids: [a.id], firme: [firmaArticolo(k.name, a.description, a.color)],
          kit: k.name, categoria: categoriaDaOrderApp(a.category), descrizione: a.description?.trim() || null, colore: a.color?.trim() || null,
          ...leggiTaglie(a.sizes_adult, a.sizes_kids),
        })))),
    }))
    .sort((a, b) => chiaveData(b.data).localeCompare(chiaveData(a.data)) || b.id.localeCompare(a.id));
}

/**
 * L'Order App chiama ancora Short/Skirt e T-Shirt Ws/Tank Top Ws: qui sono Pantaloncino/Gonnellino
 * (Short e Skirt si confondevano con Shirt) e T-Shirt Donna/Canotta Donna (WS andava decifrato).
 */
const CATEGORIE_ORDER_APP: Record<string, string> = {
  short: "Pantaloncino", skirt: "Gonnellino", "t-shirt ws": "T-Shirt Donna", "tank top ws": "Canotta Donna",
};
export function categoriaDaOrderApp(c: string | null): string | null {
  return (c && CATEGORIE_ORDER_APP[c.trim().toLowerCase()]) || c;
}

/** Ordini su cui ha senso aprire nuove schede: non annullati né persi. */
export const ordineAttivo = (o: OrdineOrderApp) => !o.perso && o.stato !== "ANNULLATO";

/** Versione leggera per i componenti client: niente referenze. */
export type OrdineBreve = Omit<OrdineOrderApp, "referenze" | "vendita"> & { nReferenze: number };
export const ordineBreve = (o: OrdineOrderApp): OrdineBreve => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { referenze, vendita, ...resto } = o;
  return { ...resto, nReferenze: referenze.length };
};
