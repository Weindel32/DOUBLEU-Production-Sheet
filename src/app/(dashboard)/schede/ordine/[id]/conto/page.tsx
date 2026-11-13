export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ContoSelezione from "@/components/ordine/ContoSelezione";
import { contoSelezione } from "@/lib/consuntivoServer";
import { statoOrdine } from "@/lib/utils";

/** Conto degli articoli scelti di un ordine: quanto pagare per taglio, confezione e le altre lavorazioni. */
export default async function ContoSelezionePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const ordineId = decodeURIComponent((await params).id);
  const sel = (await searchParams).schede;
  const ids = (typeof sel === "string" ? sel : "").split(",").filter(Boolean);
  const { ordine, cliente, articoli } = await contoSelezione(ordineId, ids);
  const base = `/schede/ordine/${encodeURIComponent(ordineId)}`;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-3xl">
      <Link href={`/schede?q=${encodeURIComponent(ordineId)}`} className="inline-flex items-center gap-2 h-11 text-sm text-[#4A5566] hover:text-[#0E1B2C]">
        <ArrowLeft size={16} /> Schede produzione
      </Link>
      <div>
        <div className="text-sm text-[#5F6878]">Conto selezione</div>
        <h1 className="font-display text-[30px] font-extrabold tracking-tight text-[#1F3A68] leading-tight">{cliente ?? "Ordine"}</h1>
        <p className="text-sm text-[#5F6878] mt-1">
          <span className="font-mono text-[#0E1B2C]">{ordineId}</span>
          {ordine?.stato && <> · {statoOrdine(ordine.stato)}</>}
          {" · costo previsto dalle schede per i pezzi consegnati: correggi i pezzi se la consegna è parziale"}
        </p>
      </div>
      {articoli.length === 0 ? (
        <p className="bg-white border border-[#E4E0D6] rounded-2xl p-8 text-center text-[#5F6878]">
          Nessun articolo selezionato. Torna all&apos;ordine e spunta quelli da pagare.
        </p>
      ) : (
        <ContoSelezione ordineId={ordineId} articoli={articoli} consuntivoHref={`${base}/consuntivo`} />
      )}
    </div>
  );
}
