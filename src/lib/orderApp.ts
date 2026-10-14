// Clienti e ordini dell'Order App, letti in sola lettura dal suo database Supabase (API REST).
// Servono ORDER_APP_SUPABASE_URL e ORDER_APP_SUPABASE_KEY su Vercel; senza, gli elenchi sono vuoti
// e la Production Sheet funziona come prima con i suoi clienti.

export interface ClienteOrderApp { id: string; nome: string; citta: string | null; categoria: string | null }

/** Una referenza dell'ordine: un articolo di un kit. */
export interface ReferenzaOrderApp { id: string; kit: string | null; categoria: string | null; descrizione: string | null; colore: string | null }

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

/** Ordini dell'Order App con le loro referenze, dal più recente. Gli ordini persi restano: possono avere schede. */
export async function ordiniOrderApp(): Promise<OrdineOrderApp[]> {
  const [ordini, kits, articoli] = await Promise.all([
    leggi<{ id: string; client: string | null; client_id: string | null; date: string | null; status: string | null; lost: boolean | null }>(
      "orders?select=id,client,client_id,date,status,lost",
    ),
    leggi<{ id: string; order_id: string; name: string | null; position: number | null }>("kits?select=id,order_id,name,position"),
    leggi<{ id: string; kit_id: string; category: string | null; description: string | null; color: string | null }>(
      "articles?select=id,kit_id,category,description,color",
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
      referenze: (kitPerOrdine.get(o.id) ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .flatMap((k) => (articoliPerKit.get(k.id) ?? []).map((a) => ({
          id: a.id, kit: k.name, categoria: a.category, descrizione: a.description?.trim() || null, colore: a.color?.trim() || null,
        }))),
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
