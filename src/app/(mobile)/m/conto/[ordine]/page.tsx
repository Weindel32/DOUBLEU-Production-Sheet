export const dynamic = "force-dynamic";
import Testata from "@/components/mobile/Testata";
import ContoSelezione from "@/components/ordine/ContoSelezione";
import { contoSelezione } from "@/lib/consuntivoServer";

/** Conto degli articoli scelti dal telefono: pezzi consegnati e quanto pagare per ogni lavorazione. */
export default async function ContoMobile({ params, searchParams }: {
  params: Promise<{ ordine: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const ordineId = decodeURIComponent((await params).ordine);
  const sel = (await searchParams).schede;
  const ids = (typeof sel === "string" ? sel : "").split(",").filter(Boolean);
  const { cliente, articoli } = await contoSelezione(ordineId, ids);

  return (
    <>
      <Testata indietro="/m/schede" elenco sopra={`Conto selezione · ${ordineId}`} titolo={cliente ?? "Ordine"} />
      <div className="px-4 pb-6">
        {articoli.length === 0 ? (
          <p className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">Nessun articolo selezionato.</p>
        ) : (
          <ContoSelezione mobile ordineId={ordineId} articoli={articoli}
            consuntivoHref={`/schede/ordine/${encodeURIComponent(ordineId)}/consuntivo`} />
        )}
      </div>
    </>
  );
}
