"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { StatoFornitore } from "@/lib/ordineFornitore";

const dataBreve = (iso: string) => { const [, m, g] = iso.split("-"); return `${g}/${m}`; };

/** Ordine al fornitore dei capi LS24: spunta "Ordinato" e poi "Arrivato", ognuna con la sua data. */
export default function SpunteFornitore({ ordineId, stato, compatto = false }: { ordineId: string; stato: StatoFornitore; compatto?: boolean }) {
  const router = useRouter();
  const [attuale, setAttuale] = useState(stato);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const cambia = async (campo: "ordinato" | "arrivato", fatto: boolean) => {
    setSalvando(true);
    setErrore(null);
    const res = await fetch(`/api/ordini/${encodeURIComponent(ordineId)}/fornitore`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campo, fatto }),
    }).catch(() => null);
    setSalvando(false);
    if (!res?.ok) { setErrore((await res?.json().catch(() => ({})))?.error || "Non salvato"); return; }
    setAttuale(await res.json());
    router.refresh();
  };

  const voce = (campo: "ordinato" | "arrivato", etichetta: string, data: string | null) => (
    <button type="button" role="checkbox" aria-checked={!!data} onClick={() => cambia(campo, !data)} disabled={salvando}
      className={`flex-1 min-h-10 px-3 rounded-lg border inline-flex items-center gap-2 text-[13px] font-semibold disabled:opacity-50 ${data ? "border-[#1D6B4A] bg-[#E3EFE8] text-[#1D6B4A]" : "border-[#D6D1C4] bg-white text-[#0E1B2C] hover:border-[#0E1B2C]/40"}`}>
      <span className={`w-5 h-5 rounded border inline-flex items-center justify-center flex-shrink-0 ${data ? "bg-[#1D6B4A] border-[#1D6B4A] text-white" : "border-[#C9C3B5] text-transparent"}`}>
        <Check size={13} strokeWidth={3} />
      </span>
      {data ? `${etichetta} il ${dataBreve(data)}` : etichetta}
    </button>
  );

  const situazione = attuale.arrivatoIl ? "Arrivato" : attuale.ordinatoIl ? "Ordinato, in attesa" : "Da ordinare";
  return (
    <div className={compatto ? "space-y-1.5" : "rounded-xl border border-[#E4E0D6] px-3.5 py-2.5 space-y-2"}>
      <div className="flex items-baseline justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#5F6878]">
        <span>Ordine fornitore</span>
        <span className={attuale.arrivatoIl ? "text-[#1D6B4A]" : attuale.ordinatoIl ? "text-[#1F3A68]" : "text-[#A8461F]"}>{situazione}</span>
      </div>
      <div className="flex gap-2">
        {voce("ordinato", "Ordinato", attuale.ordinatoIl)}
        {voce("arrivato", "Arrivato", attuale.arrivatoIl)}
      </div>
      {errore && <p role="alert" className="text-[12px] text-red-700">{errore}</p>}
    </div>
  );
}
