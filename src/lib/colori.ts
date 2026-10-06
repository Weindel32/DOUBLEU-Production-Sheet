// Colori disponibili per tessuto. Sul materiale si salvano solo i codici del fornitore
// (come stampati sulla cartella: "99", "100", "02"); il nome DOUBLEU di ogni codice sta in
// ColoreFornitore ed è condiviso da tutti i tessuti dello stesso fornitore.

export interface VoceColore { id?: string; fornitore: string; codice: string; nome: string; hex: string | null }
export interface ColoreTessuto { codice: string; nome: string | null; hex: string | null }

/** Chiave del fornitore: "cta", "CTA " e "Cta" sono lo stesso fornitore. */
export const chiaveFornitore = (f: string | null | undefined) => (f ?? "").trim().toUpperCase();

/** "99, 100 101;02" → ["99","100","101","02"]: senza doppioni, zeri iniziali conservati. */
export function parseCodici(testo: string): string[] {
  return [...new Set(testo.split(/[\s,;/]+/).map((c) => c.trim().toUpperCase()).filter(Boolean))];
}

export function leggiCodici(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Dizionario codice → voce per un fornitore. */
export function dizionarioFornitore(voci: VoceColore[], fornitore: string | null | undefined) {
  const k = chiaveFornitore(fornitore);
  return new Map(voci.filter((v) => chiaveFornitore(v.fornitore) === k).map((v) => [v.codice, v]));
}

export function coloriTessuto(codici: string[], diz: Map<string, VoceColore>): ColoreTessuto[] {
  return codici.map((codice) => {
    const v = diz.get(codice);
    return { codice, nome: v?.nome ?? null, hex: v?.hex ?? null };
  });
}

/** Come va scritto il colore per il produttore: "Blu scuro · CTA col. 100". */
export function etichettaColore(nome: string | null | undefined, codice: string | null | undefined, fornitore?: string | null) {
  if (!codice) return nome || null;
  const rif = [chiaveFornitore(fornitore) || null, `col. ${codice}`].filter(Boolean).join(" ");
  return nome ? `${nome} · ${rif}` : rif;
}
