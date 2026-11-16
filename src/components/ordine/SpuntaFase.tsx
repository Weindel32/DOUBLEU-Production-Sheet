"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

/** Spunta "fase completa" del consuntivo: da lì la fase conta lo speso vero, anche sotto il previsto. */
export default function SpuntaFase({ ordineId, fase, completa }: { ordineId: string; fase: string; completa: boolean }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const cambia = async () => {
    setSalvando(true);
    setErrore(null);
    const res = await fetch(`/api/ordini/${encodeURIComponent(ordineId)}/consuntivo`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fase, completa: !completa }),
    });
    setSalvando(false);
    if (!res.ok) { setErrore((await res.json().catch(() => ({}))).error || "Non salvato"); return; }
    router.refresh();
  };

  return (
    <span className="inline-flex flex-col items-center">
      <button type="button" role="checkbox" aria-checked={completa} aria-label={`${fase} completa`} onClick={cambia} disabled={salvando}
        title={completa ? "Fase completa: conta lo speso" : "Segna completa quando tutte le spese della fase sono registrate"}
        className={`w-7 h-7 rounded-md border inline-flex items-center justify-center disabled:opacity-50 ${completa ? "bg-[#1D6B4A] border-[#1D6B4A] text-white" : "bg-white border-[#C9C3B5] text-transparent hover:border-[#1D6B4A]"}`}>
        <Check size={16} strokeWidth={3} />
      </button>
      {errore && <span role="alert" className="text-[11px] text-red-700 mt-1 max-w-[140px] text-center">{errore}</span>}
    </span>
  );
}
