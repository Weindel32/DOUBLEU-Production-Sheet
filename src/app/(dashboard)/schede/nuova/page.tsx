export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { normalizzaTipo } from "@/lib/utils";
import NuovaSchedaForm from "@/components/scheda/NuovaSchedaForm";
import { costiPerModello } from "@/lib/costiModelli";
import { ordiniOrderApp, ordineAttivo } from "@/lib/orderApp";
import { chiaveParte, parteScheda } from "@/lib/referenze";

/** ?tipo=costo|produzione, ?modello=CODICE (da "Modelli") e ?ordine=DU-… (dall'elenco ordini) precompilano il form. */
export default async function NuovaSchedaPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const [modelli, costi, ordini] = await Promise.all([
    prisma.modello.findMany({
      orderBy: { codice: "asc" },
      select: { codice: true, descrizione: true, categoria: true, fascia: true },
    }),
    costiPerModello(),
    ordiniOrderApp(),
  ]);
  const ordineIniziale = str("ordine");
  const ordiniScelta = ordini.filter((o) => ordineAttivo(o) || o.id === ordineIniziale);
  const conScheda = await prisma.scheda.findMany({ where: { articoloOrderAppId: { not: null } }, select: { articoloOrderAppId: true, genere: true } });
  return <NuovaSchedaForm tipoIniziale={normalizzaTipo(str("tipo"))} modelloIniziale={str("modello")} modelli={modelli} costiEsistenti={costi}
    ordini={ordiniScelta} ordineIniziale={ordineIniziale} articoliConScheda={conScheda.map((s) => chiaveParte(s.articoloOrderAppId!, parteScheda(s.genere)))} />;
}
