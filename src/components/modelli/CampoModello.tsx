"use client";

import { useId, useState } from "react";
import { inputCls } from "@/components/ui/Form";
import { ordinaCategorie } from "@/lib/utils";

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

/** Fasce del modello adatte al genere della scheda; null = nessun filtro (Unisex o non scelto). */
export function fascePerGenere(genere: string | null | undefined): string[] | null {
  if (genere === "Donna") return ["Donna"];
  if (genere === "Uomo") return ["Uomo", "Adulto"];
  if (genere === "Junior") return ["Kids"];
  return null;
}

/**
 * Campo "Modello": codice del cartamodello del modellista, con suggerimenti dall'archivio.
 * I suggerimenti seguono categoria e genere della scheda (T-Shirt WS + Donna → solo quelle);
 * "mostra tutti" toglie il filtro. Un codice che non è in archivio resta valido.
 */
export default function CampoModello({ value, onChange, onBlur, modelli, id, categoria, genere }: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  modelli: ModelloBreve[];
  id?: string;
  categoria?: string;
  genere?: string;
}) {
  const listId = useId();
  const [tutti, setTutti] = useState(false);
  const trovato = trovaModello(modelli, value);

  const fasce = fascePerGenere(genere);
  const filtrati = modelli.filter((m) => (!categoria || m.categoria === categoria) && (!fasce || fasce.includes(m.fascia)));
  const filtroAttivo = !tutti && !!(categoria || fasce) && filtrati.length > 0;
  // Senza filtro i modelli vanno in ordine di categoria (come nella pagina Modelli), poi di codice.
  const ordine = ordinaCategorie(modelli.map((m) => m.categoria));
  const elenco = (filtroAttivo ? filtrati : modelli).slice().sort((a, b) =>
    ordine.indexOf(a.categoria) - ordine.indexOf(b.categoria) || a.codice.localeCompare(b.codice, "it", { numeric: true }));
  const descrizioneFiltro = [categoria, fasce ? genere : null].filter(Boolean).join(" · ");
  return (
    <span className="flex flex-col gap-1">
      <input id={id} type="text" list={listId} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        placeholder="es. DUSP 09" autoCapitalize="characters" autoComplete="off" className={`${inputCls} font-mono`} />
      <datalist id={listId}>
        {elenco.map((m) => <option key={m.codice} value={m.codice}>{`${m.descrizione} · ${m.categoria} · ${m.fascia}`}</option>)}
      </datalist>
      {!trovato && (categoria || fasce) && (
        <span className="text-xs text-[#5F6878]">
          {filtroAttivo ? (
            <>Solo {descrizioneFiltro} ({filtrati.length}) · <button type="button" onClick={() => setTutti(true)} className="text-[#1F3A68] underline underline-offset-2">mostra tutti</button></>
          ) : tutti ? (
            <>Tutti i modelli · <button type="button" onClick={() => setTutti(false)} className="text-[#1F3A68] underline underline-offset-2">solo {descrizioneFiltro}</button></>
          ) : (
            <>Nessun modello {descrizioneFiltro}: li mostro tutti</>
          )}
        </span>
      )}
      {trovato && <span className="text-xs text-[#1D6B4A]">{trovato.descrizione} · {trovato.categoria} · {trovato.fascia}</span>}
    </span>
  );
}
