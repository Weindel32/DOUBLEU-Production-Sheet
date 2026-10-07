// Clienti dell'Order App, letti in sola lettura dal suo database Supabase (API REST).
// Servono ORDER_APP_SUPABASE_URL e ORDER_APP_SUPABASE_KEY su Vercel; senza, l'elenco è vuoto
// e la Production Sheet funziona come prima con i suoi clienti.

export interface ClienteOrderApp { id: string; nome: string; citta: string | null; categoria: string | null }

export const orderAppConfigurata = () => !!(process.env.ORDER_APP_SUPABASE_URL && process.env.ORDER_APP_SUPABASE_KEY);

export async function clientiOrderApp(): Promise<ClienteOrderApp[]> {
  const url = process.env.ORDER_APP_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.ORDER_APP_SUPABASE_KEY;
  if (!url || !key) return [];
  try {
    const headers: Record<string, string> = { apikey: key };
    // Le chiavi "legacy" sono JWT e vanno anche nell'Authorization; le nuove sb_secret_ no.
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(`${url}/rest/v1/clients?select=id,name,city,category&order=name.asc`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error("Order App: clienti non letti", res.status, await res.text().catch(() => ""));
      return [];
    }
    const righe = (await res.json()) as { id: string; name: string; city: string | null; category: string | null }[];
    return righe.map((r) => ({ id: r.id, nome: r.name, citta: r.city || null, categoria: r.category }));
  } catch (err) {
    console.error("Order App: clienti non letti", err);
    return [];
  }
}
