"use client";

import { useState, type ReactNode } from "react";
import PannelloBasso from "@/components/ui/PannelloBasso";

type Richiesta = {
  titolo: string;
  testo?: string;
  /** Etichetta del pulsante che conferma; senza, è un semplice avviso con "Ho capito". */
  conferma?: string;
  /** Azione che toglie o riporta indietro qualcosa: pulsante arancione. */
  delicata?: boolean;
  esito: (ok: boolean) => void;
};

/**
 * Conferme e avvisi al posto di confirm()/alert(): sul telefono un pannello dal basso con pulsanti grandi,
 * su schermi larghi restano le finestre del browser. `elemento` va messo nel JSX del componente.
 */
export function useConferma(): {
  chiedi: (r: { titolo: string; testo?: string; conferma: string; delicata?: boolean }) => Promise<boolean>;
  avvisa: (titolo: string, testo?: string) => Promise<void>;
  elemento: ReactNode;
} {
  const [richiesta, setRichiesta] = useState<Richiesta | null>(null);
  const [risposta, setRisposta] = useState(false);
  const [chiusura, setChiusura] = useState(false);
  const telefono = () => window.innerWidth < 640;

  const chiedi: ReturnType<typeof useConferma>["chiedi"] = (r) => {
    if (!telefono()) return Promise.resolve(confirm([r.titolo, r.testo].filter(Boolean).join("\n\n")));
    return new Promise((esito) => { setRisposta(false); setChiusura(false); setRichiesta({ ...r, esito }); });
  };
  const avvisa: ReturnType<typeof useConferma>["avvisa"] = (titolo, testo) => {
    if (!telefono()) { alert([titolo, testo].filter(Boolean).join("\n\n")); return Promise.resolve(); }
    return new Promise((fine) => { setRisposta(false); setChiusura(false); setRichiesta({ titolo, testo, esito: () => fine() }); });
  };

  const elemento = richiesta && (
    // La risposta si consegna a pannello chiuso: chiudere toccando fuori o trascinando vale "Annulla".
    <PannelloBasso titolo={richiesta.titolo} chiudi={chiusura}
      onChiudi={() => { richiesta.esito(risposta); setRichiesta(null); }}>
      {richiesta.testo && <p className="px-2 text-[15px] text-[#4A5566] leading-snug">{richiesta.testo}</p>}
      <div className="pt-4 space-y-2">
        <button type="button" onClick={() => { setRisposta(true); setChiusura(true); }} disabled={chiusura}
          className={`w-full h-12 rounded-xl text-[16px] font-semibold text-white ${richiesta.conferma && richiesta.delicata ? "bg-[#A8461F] active:bg-[#8F3B1A]" : "bg-[#0E1B2C] active:bg-[#1F3A68]"}`}>
          {richiesta.conferma ?? "Ho capito"}
        </button>
        {richiesta.conferma && (
          <button type="button" onClick={() => setChiusura(true)} disabled={chiusura}
            className="w-full h-12 rounded-xl text-[16px] font-medium text-[#0E1B2C] bg-[#EEEBE3] active:bg-[#E4E0D6]">
            Annulla
          </button>
        )}
      </div>
    </PannelloBasso>
  );
  return { chiedi, avvisa, elemento };
}
