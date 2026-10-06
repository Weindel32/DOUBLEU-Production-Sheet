import { parseCodici } from "@/lib/colori";

/** Prezzo di un materiale così come lo si legge sul listino del fornitore. */
export function prezzoListino(m: { unitaMisura: string | null; costoMetro: number | null; prezzoKg: number | null }):
  { valore: number | null; unita: string } {
  if (m.unitaMisura === "kg") return { valore: m.prezzoKg, unita: "€/kg" };
  if (m.unitaMisura === "pz") return { valore: m.costoMetro, unita: "€/pz" };
  return { valore: m.costoMetro, unita: "€/m" };
}

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2).replace(".", ","));

/**
 * Riga da aggiungere in cima alle note quando cambia il prezzo di listino:
 * "29/09/2026 · prezzo 7,40 → 7,90 €/kg". Null se il prezzo non è cambiato.
 */
export function rigaCambioPrezzo(
  prima: { unitaMisura: string | null; costoMetro: number | null; prezzoKg: number | null },
  dopo: { unitaMisura: string | null; costoMetro: number | null; prezzoKg: number | null },
  data = new Date(),
): string | null {
  const a = prezzoListino(prima);
  const b = prezzoListino(dopo);
  const uguale = a.unita === b.unita && (a.valore ?? null) === (b.valore ?? null);
  if (uguale || (a.valore === null && b.valore === null)) return null;
  const giorno = data.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" });
  const da = a.unita === b.unita ? fmt(a.valore) : `${fmt(a.valore)} ${a.unita}`;
  return `${giorno} · prezzo ${da} → ${fmt(b.valore)} ${b.unita}`;
}

/** Codici colore come arrivano dai form (array o testo "99, 100") → JSON da salvare, null se vuoto. */
export function codiciJson(valore: unknown): string | null {
  const codici = Array.isArray(valore) ? parseCodici(valore.join(",")) : typeof valore === "string" ? parseCodici(valore) : [];
  return codici.length ? JSON.stringify(codici) : null;
}
