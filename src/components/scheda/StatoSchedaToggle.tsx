"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useConferma } from "@/components/ui/Conferma";

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
export default function StatoSchedaToggle({ id, stato, className = "" }: { id: string; stato: string; className?: string }) {
  const [corrente, setCorrente] = useState(stato);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const prossimo = corrente === "esecutiva" ? "bozza" : "esecutiva";
  const { chiedi, avvisa, elemento } = useConferma();

  const cambia = async () => {
    // Riportare in bozza una scheda già esecutiva va confermato: può essere già in lavorazione.
    if (prossimo === "bozza" && !(await chiedi({ titolo: "Riportare la scheda in bozza?", testo: "Può essere già in lavorazione.", conferma: "Riporta in bozza", delicata: true }))) return;
    const prima = corrente;
    setCorrente(prossimo);
    if (!(await salvaStato(id, prossimo))) {
      setCorrente(prima);
      await avvisa("Cambio di stato non riuscito", "Controlla la connessione e riprova.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <>{elemento}<button
      type="button"
      onClick={cambia}
      disabled={pending}
      title={`Clic per segnare come ${ETICHETTA[prossimo]}`}
      aria-label={`Stato ${ETICHETTA[corrente] ?? corrente}: segna come ${ETICHETTA[prossimo]}`}
      className={`badge badge-${corrente} cursor-pointer hover:brightness-95 hover:shadow-sm transition disabled:opacity-60 ${className}`}
    >
      {ETICHETTA[corrente] ?? corrente}
    </button></>
  );
}

/** Azione sull'intestazione dell'ordine: tutte le bozze del blocco diventano esecutive. */
export function RendiEsecutive({ ids, className }: { ids: string[]; className?: string }) {
  const [pending, startTransition] = useTransition();
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();
  const { chiedi, avvisa, elemento } = useConferma();

  const esegui = async (e: React.MouseEvent) => {
    // Il pulsante sta dentro il <summary>: senza questo aprirebbe/chiuderebbe il blocco.
    e.preventDefault();
    e.stopPropagation();
    if (!(await chiedi({ titolo: `Segnare come esecutive ${ids.length} ${ids.length === 1 ? "scheda" : "schede"} in bozza?`, conferma: "Rendi esecutive" }))) return;
    setSalvando(true);
    const esiti = await Promise.all(ids.map((id) => salvaStato(id, "esecutiva")));
    setSalvando(false);
    const falliti = esiti.filter((ok) => !ok).length;
    if (falliti) await avvisa(`${falliti} ${falliti === 1 ? "scheda non aggiornata" : "schede non aggiornate"}`, "Controlla la connessione e riprova.");
    startTransition(() => router.refresh());
  };

  return (
    <>{elemento}<button
      type="button"
      onClick={esegui}
      disabled={salvando || pending}
      className={className ?? "h-10 px-3.5 rounded-lg border border-[#BFDFCC] bg-[#DDEFE5] text-[13px] font-semibold text-[#1D6B4A] inline-flex items-center gap-1.5 hover:border-[#1D6B4A]/50 disabled:opacity-60"}
    >
      <CheckCircle size={15} /> {salvando ? "Salvo…" : `Rendi esecutive (${ids.length})`}
    </button></>
  );
}
