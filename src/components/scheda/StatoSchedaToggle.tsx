"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const ETICHETTA: Record<string, string> = { bozza: "Bozza", esecutiva: "Esecutiva" };

async function salvaStato(id: string, stato: string) {
  const res = await fetch(`/api/schede/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stato }),
  });
  return res.ok;
}

/** Badge di stato cliccabile nell'elenco: Bozza ⇄ Esecutiva senza aprire la scheda. */
export default function StatoSchedaToggle({ id, stato }: { id: string; stato: string }) {
  const [corrente, setCorrente] = useState(stato);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const prossimo = corrente === "esecutiva" ? "bozza" : "esecutiva";

  const cambia = async () => {
    // Riportare in bozza una scheda già esecutiva va confermato: può essere già in lavorazione.
    if (prossimo === "bozza" && !confirm("Riportare la scheda in bozza?")) return;
    const prima = corrente;
    setCorrente(prossimo);
    if (!(await salvaStato(id, prossimo))) {
      setCorrente(prima);
      alert("Cambio di stato non riuscito");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={cambia}
      disabled={pending}
      title={`Clic per segnare come ${ETICHETTA[prossimo]}`}
      aria-label={`Stato ${ETICHETTA[corrente] ?? corrente}: segna come ${ETICHETTA[prossimo]}`}
      className={`badge badge-${corrente} cursor-pointer hover:brightness-95 hover:shadow-sm transition disabled:opacity-60`}
    >
      {ETICHETTA[corrente] ?? corrente}
    </button>
  );
}

/** Azione sull'intestazione dell'ordine: tutte le bozze del blocco diventano esecutive. */
export function RendiEsecutive({ ids }: { ids: string[] }) {
  const [pending, startTransition] = useTransition();
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const esegui = async (e: React.MouseEvent) => {
    // Il pulsante sta dentro il <summary>: senza questo aprirebbe/chiuderebbe il blocco.
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Segnare come esecutive ${ids.length} ${ids.length === 1 ? "scheda" : "schede"} in bozza?`)) return;
    setSalvando(true);
    const esiti = await Promise.all(ids.map((id) => salvaStato(id, "esecutiva")));
    setSalvando(false);
    const falliti = esiti.filter((ok) => !ok).length;
    if (falliti) alert(`${falliti} ${falliti === 1 ? "scheda non aggiornata" : "schede non aggiornate"}`);
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={esegui}
      disabled={salvando || pending}
      className="h-10 px-3.5 rounded-lg border border-[#BFDFCC] bg-[#DDEFE5] text-[13px] font-semibold text-[#1D6B4A] inline-flex items-center gap-1.5 hover:border-[#1D6B4A]/50 disabled:opacity-60"
    >
      <CheckCircle size={15} /> {salvando ? "Salvo…" : `Rendi esecutive (${ids.length})`}
    </button>
  );
}
