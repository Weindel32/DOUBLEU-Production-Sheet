export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { normalizzaTipo } from "@/lib/utils";
import NuovaSchedaForm from "@/components/scheda/NuovaSchedaForm";
import { costiPerModello } from "@/lib/costiModelli";

/** ?tipo=costo|produzione e ?modello=CODICE (da "Modelli") precompilano il form. */
export default async function NuovaSchedaPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const [modelli, costi] = await Promise.all([
    prisma.modello.findMany({
      orderBy: { codice: "asc" },
      select: { codice: true, descrizione: true, categoria: true, fascia: true },
    }),
    costiPerModello(),
  ]);
  return <NuovaSchedaForm tipoIniziale={normalizzaTipo(str("tipo"))} modelloIniziale={str("modello")} modelli={modelli} costiEsistenti={costi} />;
}
