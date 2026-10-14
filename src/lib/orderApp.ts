// Clienti e ordini dell'Order App, letti in sola lettura dal suo database Supabase (API REST).
// Servono ORDER_APP_SUPABASE_URL e ORDER_APP_SUPABASE_KEY su Vercel; senza, gli elenchi sono vuoti
// e la Production Sheet funziona come prima con i suoi clienti.

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
}

type TaglieOrderApp = Record<string, number | null> | null;

/** Taglie dell'articolo: adulto così come sono, bambino "6" → "6A" come nella scheda; "__qty" è il totale senza taglie. */
function leggiTaglie(adulto: TaglieOrderApp, bambino: TaglieOrderApp) {
  const taglie: Record<string, number> = {};
  for (const [t, q] of Object.entries(adulto ?? {})) if (t !== "__qty" && q && q > 0) taglie[t] = q;
  for (const [t, q] of Object.entries(bambino ?? {})) if (t !== "__qty" && q && q > 0) taglie[/^\d+$/.test(t) ? `${t}A` : t] = q;
  const somma = Object.values(taglie).reduce((a, b) => a + b, 0);
  const totale = (adulto?.__qty ?? 0) + (bambino?.__qty ?? 0);
  return { taglie: somma > 0 ? taglie : null, capi: somma > 0 ? somma : totale > 0 ? totale : null };
}

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

/**
 * Lo stesso articolo ripetuto nell'ordine (es. due pantaloncini nello stesso kit, o in due kit)
 * è una sola referenza: una sola scheda di produzione. I kit in cui compare si elencano insieme.
 */
function unisciUguali(righe: ReferenzaOrderApp[]): ReferenzaOrderApp[] {
  const perChiave = new Map<string, ReferenzaOrderApp>();
  for (const r of righe) {
    const k = [r.descrizione ?? r.categoria, r.colore].map((v) => (v ?? "").trim().toLowerCase()).join("|");
    const prima = perChiave.get(k);
    if (!prima) { perChiave.set(k, { ...r, ids: [...r.ids], taglie: r.taglie && { ...r.taglie } }); continue; }
    if (r.kit && !(prima.kit ?? "").split(" · ").includes(r.kit)) prima.kit = prima.kit ? `${prima.kit} · ${r.kit}` : r.kit;
    // Due pantaloncini uguali nel kit sono il doppio dei capi: quantità e taglie si sommano.
    prima.ids.push(...r.ids);
    if (r.capi) prima.capi = (prima.capi ?? 0) + r.capi;
    if (r.taglie) {
      prima.taglie ??= {};
      for (const [t, q] of Object.entries(r.taglie)) prima.taglie[t] = (prima.taglie[t] ?? 0) + q;
    }
  }
  return [...perChiave.values()];
}

/** Ordini dell'Order App con le loro referenze, dal più recente. Gli ordini persi restano: possono avere schede. */
export async function ordiniOrderApp(): Promise<OrdineOrderApp[]> {
  const [ordini, kits, articoli] = await Promise.all([
    leggi<{ id: string; client: string | null; client_id: string | null; date: string | null; status: string | null; lost: boolean | null }>(
      "orders?select=id,client,client_id,date,status,lost",
    ),
    leggi<{ id: string; order_id: string; name: string | null; position: number | null }>("kits?select=id,order_id,name,position"),
    leggi<{ id: string; kit_id: string; category: string | null; description: string | null; color: string | null; sizes_adult: TaglieOrderApp; sizes_kids: TaglieOrderApp }>(
      "articles?select=id,kit_id,category,description,color,sizes_adult,sizes_kids",
    ),
  ]);
  if (!ordini) return [];
  const kitPerOrdine = new Map<string, { id: string; name: string | null; position: number | null }[]>();
  for (const k of kits ?? []) kitPerOrdine.set(k.order_id, [...(kitPerOrdine.get(k.order_id) ?? []), k]);
  const articoliPerKit = new Map<string, NonNullable<typeof articoli>>();
  for (const a of articoli ?? []) articoliPerKit.set(a.kit_id, [...(articoliPerKit.get(a.kit_id) ?? []), a]);

  return ordini
    .map((o) => ({
      id: o.id,
      clienteId: o.client_id,
      cliente: (o.client ?? "").trim() || "Senza cliente",
      data: o.date,
      stato: o.status,
      perso: !!o.lost,
      referenze: unisciUguali((kitPerOrdine.get(o.id) ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .flatMap((k) => (articoliPerKit.get(k.id) ?? []).map((a) => ({
          id: a.id, ids: [a.id], kit: k.name, categoria: a.category, descrizione: a.description?.trim() || null, colore: a.color?.trim() || null,
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
