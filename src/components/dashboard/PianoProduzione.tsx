"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Factory, Pencil } from "lucide-react";
import { GIORNI_PRODUZIONE_DEFAULT, inItaliano, type PianoProduzione as Piano } from "@/lib/produzione";
import { inputCls } from "@/components/ui/Form";

const conGiorno = (s: string) =>
  `${new Date(`${s}T00:00:00Z`).toLocaleDateString("it-IT", { weekday: "short", timeZone: "UTC" })} ${inItaliano(s).slice(0, 5)}`;

/** Riga "Produzione" della card ordine: ricezione taglie → inizio → pronto, confrontato con la consegna. Modificabile. */
export default function PianoProduzione({ ordineId, piano, consegna }: { ordineId: string; piano: Piano; consegna: string | null }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [giorni, setGiorni] = useState(String(piano.giorni));
  const [inizio, setInizio] = useState(piano.inizioManuale && piano.inizio ? piano.inizio : "");
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salva = async () => {
    setSalvando(true);
    setErrore(null);
    const res = await fetch(`/api/ordini/${encodeURIComponent(ordineId)}/piano`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giorniProduzione: Number(giorni) === GIORNI_PRODUZIONE_DEFAULT ? null : giorni, inizioProduzione: inizio || null }),
    });
    setSalvando(false);
    if (!res.ok) { setErrore((await res.json().catch(() => ({}))).error || "Salvataggio non riuscito"); return; }
    setAperto(false);
    router.refresh();
  };

  const esito = piano.ritardo === null
    ? (consegna ? null : <span className="text-[#5F6878]">consegna al club da fissare</span>)
    : piano.ritardo > 0
      ? <span className="font-semibold text-[#A8461F]">{piano.ritardo} {piano.ritardo === 1 ? "giorno" : "giorni"} dopo la consegna ({consegna})</span>
      : <span className="font-semibold text-[#1D6B4A]">{-piano.ritardo} {piano.ritardo === -1 ? "giorno" : "giorni"} prima della consegna ({consegna})</span>;

  return (
    <div className="rounded-xl bg-[#F6F4EF] px-3.5 py-2.5 text-[13px] text-[#4A5566]">
      <div className="flex items-start gap-2">
        <Factory size={15} className="mt-0.5 flex-shrink-0 text-[#1F3A68]" />
        <div className="flex-1 min-w-0 space-y-0.5">
          {piano.inizio ? (
            <>
              <div>
                {piano.inizioManuale
                  ? <>Inizio produzione <strong className="text-[#0E1B2C]">{conGiorno(piano.inizio)}</strong> (a mano)</>
                  : <>Taglie ricevute {conGiorno(piano.ricezione!)} → inizio <strong className="text-[#0E1B2C]">{conGiorno(piano.inizio)}</strong></>}
                {" · "}{piano.giorni} gg lavorativi
              </div>
              <div>Pronto <strong className="text-[#0E1B2C]">{conGiorno(piano.pronto!)}</strong>{esito && <> · {esito}</>}</div>
            </>
          ) : (
            <div>In attesa delle taglie: la produzione ({piano.giorni} gg lavorativi) parte dalla loro ricezione.</div>
          )}
        </div>
        <button type="button" onClick={() => setAperto((a) => !a)} aria-expanded={aperto} aria-label="Modifica tempi di produzione"
          className="w-8 h-8 -my-1 rounded-lg inline-flex items-center justify-center text-[#5F6878] hover:bg-white hover:text-[#0E1B2C] flex-shrink-0">
          <Pencil size={14} />
        </button>
      </div>
      {aperto && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E4E0D6] flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[12px]">
            Giorni lavorativi
            <input type="number" min={1} max={365} value={giorni} onChange={(e) => setGiorni(e.target.value)} className={`${inputCls} !w-24 !h-10`} />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            Inizio a mano <span className="text-[#5F6878]">(vuoto = dalla ricezione taglie)</span>
            <input type="date" value={inizio} onChange={(e) => setInizio(e.target.value)} className={`${inputCls} !w-44 !h-10`} />
          </label>
          <button type="button" onClick={salva} disabled={salvando}
            className="h-10 px-4 rounded-lg bg-[#0E1B2C] text-white text-[13px] font-semibold hover:bg-[#1F3A68] disabled:opacity-50">
            {salvando ? "Salvo…" : "Salva"}
          </button>
          {errore && <span role="alert" className="text-[12px] text-red-700 w-full">{errore}</span>}
        </div>
      )}
    </div>
  );
}
