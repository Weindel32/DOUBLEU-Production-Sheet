import { prisma } from "@/lib/prisma";
import { clientiOrderApp, ordiniOrderApp } from "@/lib/orderApp";
import { firmaDi, type StatoReferenza } from "@/lib/referenze";

/**
 * Cliente locale collegato a un cliente dell'Order App: lo crea la prima volta, poi riusa sempre lo stesso.
 * Il nome è sempre quello dell'Order App: se lì cambia, si aggiorna anche qui.
 */
export async function collegaCliente(orderAppId: string) {
  const oa = (await clientiOrderApp()).find((c) => c.id === orderAppId);
  const esistente = await prisma.cliente.findUnique({ where: { orderAppId } });
  if (esistente) {
    if (oa && (oa.nome !== esistente.nome || oa.citta !== esistente.citta))
      return prisma.cliente.update({ where: { id: esistente.id }, data: { nome: oa.nome, citta: oa.citta } });
    return esistente;
  }
  if (!oa) return null;
  return prisma.cliente.create({ data: { nome: oa.nome, citta: oa.citta, orderAppId: oa.id } });
}

/** Ordine dell'Order App → campi della scheda: l'ordine porta con sé il cliente. */
export async function datiOrdine(ordineId: string | null): Promise<{ ordineOrderAppId: string | null; clienteId?: string | null } | { error: string }> {
  if (!ordineId) return { ordineOrderAppId: null };
  const ordine = (await ordiniOrderApp()).find((o) => o.id === ordineId);
  if (!ordine) return { error: "Ordine non trovato nell'Order App" };
  const cliente = ordine.clienteId ? await collegaCliente(ordine.clienteId) : null;
  // Ordine senza cliente collegato: si tiene il cliente che la scheda ha già.
  return cliente ? { ordineOrderAppId: ordine.id, clienteId: cliente.id } : { ordineOrderAppId: ordine.id };
}

/** Firma dell'articolo dell'ordine, salvata con il collegamento: ritrova la referenza se l'Order App cambia l'id. */
export async function firmaArticoloOrdine(ordineId: string | null | undefined, articoloId: string | null | undefined) {
  if (!ordineId || !articoloId) return null;
  const ordine = (await ordiniOrderApp()).find((o) => o.id === ordineId);
  return ordine ? firmaDi(ordine.referenze, articoloId) : null;
}

/**
 * Schede ritrovate per firma (l'Order App aveva cambiato l'id dell'articolo): si salva l'id nuovo,
 * così il collegamento torna diretto. Senza toccare updatedAt: non è una modifica dell'utente.
 */
export async function salvaRicollegamenti(righe: { id: string; stato: StatoReferenza }[]) {
  await Promise.all(righe.map(({ id, stato }) => stato.tipo === "collegata" && stato.ricollegata
    ? prisma.$executeRaw`UPDATE "Scheda" SET "articoloOrderAppId" = ${stato.ricollegata} WHERE "id" = ${id}`
        .catch((err) => console.error("Ricollegamento scheda non salvato", id, err))
    : null));
}
