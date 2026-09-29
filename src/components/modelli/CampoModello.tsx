"use client";

import { useId } from "react";
import { inputCls } from "@/components/ui/Form";

export interface ModelloBreve {
  codice: string;
  descrizione: string;
  categoria: string;
  fascia: string;
}

/** Cerca un modello per codice ignorando maiuscole e spazi ai bordi ("dusp 09" → "DUSP 09"). */
export function trovaModello(modelli: ModelloBreve[], codice: string): ModelloBreve | undefined {
  const c = codice.trim().toLowerCase();
  return c ? modelli.find((m) => m.codice.toLowerCase() === c) : undefined;
}

/**
 * Campo "Modello": codice del cartamodello del modellista, con suggerimenti dall'archivio.
 * Un codice che non è in archivio resta valido; chi lo usa decide se proporre di aggiungerlo.
 */
export default function CampoModello({ value, onChange, onBlur, modelli, id }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  modelli: ModelloBreve[];
  id?: string;
}) {
  const listId = useId();
  const trovato = trovaModello(modelli, value);
  return (
    <span className="flex flex-col gap-1">
      <input id={id} type="text" list={listId} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        placeholder="es. DUSP 09" autoCapitalize="characters" autoComplete="off" className={`${inputCls} font-mono`} />
      <datalist id={listId}>
        {modelli.map((m) => <option key={m.codice} value={m.codice}>{`${m.descrizione} · ${m.categoria} · ${m.fascia}`}</option>)}
      </datalist>
      {trovato && <span className="text-xs text-[#1D6B4A]">{trovato.descrizione} · {trovato.categoria} · {trovato.fascia}</span>}
    </span>
  );
}
