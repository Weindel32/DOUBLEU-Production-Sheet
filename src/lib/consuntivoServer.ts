import { prisma } from "@/lib/prisma";
import { ordiniOrderApp } from "@/lib/orderApp";
import { capiAcquisto, riepilogoAcquisti, type SchedaAcquisto } from "@/lib/approvvigionamento";
import { schedaAcquisto } from "@/lib/approvvigionamentoServer";
import { riepilogoScheda } from "@/lib/costiScheda";
import { confrontoTessuto, riepilogoConsuntivo, type FabbisognoTessuto } from "@/lib/consuntivo";
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
  const acquisti: SchedaAcquisto[] = [];
  const schede = schedeRows.flatMap((s) => {
    const acq = schedaAcquisto(s, ordine);
    if (acq.esclusa) return [];
    acquisti.push(acq);
    const { capi, stimati } = capiAcquisto(acq);
    return [{ ...s, capi, stimati, costi: riepilogoScheda(s, materiali) }];
  });

  // Tessuto che si prevedeva di comprare, per unità: serve solo se le spese hanno la quantità.
  const fabbisogno: FabbisognoTessuto[] = [];
  for (const r of riepilogoAcquisti(acquisti, materiali).fornitori.flatMap((g) => g.righe)) {
    const a = r.acquisto;
    if (!a || a.unita === "pz") continue;
    let f = fabbisogno.find((x) => x.unita === a.unita);
    if (!f) fabbisogno.push(f = { unita: a.unita, netto: 0, daComprare: 0, listino: 0, quantitaListino: 0 });
    f.netto += a.netto;
    f.daComprare += a.daComprare;
    if (a.stima != null) { f.listino += a.stima; f.quantitaListino += a.daComprare; }
  }

  return {
    ordineId,
    ordine,
    cliente: ordine?.cliente ?? schedeRows.find((s) => s.cliente)?.cliente?.nome ?? null,
    nSchede: schede.length,
    capiStimati: schede.some((s) => s.stimati && s.capi > 0),
    spese,
    chiusoIl: chiusura?.chiusoIl ?? null,
    riepilogo: riepilogoConsuntivo(schede, spese, !!chiusura?.chiusoIl),
    tessuto: confrontoTessuto(spese, fabbisogno),
  };
}
