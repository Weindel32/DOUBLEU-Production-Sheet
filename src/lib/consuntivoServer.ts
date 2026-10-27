import { prisma } from "@/lib/prisma";
import { ordiniOrderApp } from "@/lib/orderApp";
import { capiAcquisto } from "@/lib/approvvigionamento";
import { schedaAcquisto } from "@/lib/approvvigionamentoServer";
import { riepilogoScheda } from "@/lib/costiScheda";
import { riepilogoConsuntivo } from "@/lib/consuntivo";
import { TIPI_COSTO_DB } from "@/lib/utils";

/** Spese, previsto dalle schede e stato di chiusura del consuntivo di un ordine dell'Order App. */
export async function consuntivoOrdine(ordineId: string) {
  const [schedeRows, materiali, spese, chiusura, ordini] = await Promise.all([
    prisma.scheda.findMany({
      where: { ordineOrderAppId: ordineId, tipo: { notIn: TIPI_COSTO_DB } },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.materiale.findMany(),
    prisma.spesaOrdine.findMany({ where: { ordineOrderAppId: ordineId }, orderBy: [{ data: "desc" }, { createdAt: "desc" }] }),
    prisma.consuntivoOrdine.findUnique({ where: { ordineOrderAppId: ordineId } }),
    ordiniOrderApp(),
  ]);
  const ordine = ordini.find((o) => o.id === ordineId) ?? null;
  // Stessi capi dell'approvvigionamento: taglie della scheda, o capi dell'ordine come stima.
  const schede = schedeRows.flatMap((s) => {
    const acq = schedaAcquisto(s, ordine);
    if (acq.esclusa) return [];
    const { capi, stimati } = capiAcquisto(acq);
    return [{ ...s, capi, stimati, costi: riepilogoScheda(s, materiali) }];
  });

  return {
    ordineId,
    ordine,
    cliente: ordine?.cliente ?? schedeRows.find((s) => s.cliente)?.cliente?.nome ?? null,
    nSchede: schede.length,
    capiStimati: schede.some((s) => s.stimati && s.capi > 0),
    spese,
    chiusoIl: chiusura?.chiusoIl ?? null,
    riepilogo: riepilogoConsuntivo(schede, spese, !!chiusura?.chiusoIl),
  };
}
