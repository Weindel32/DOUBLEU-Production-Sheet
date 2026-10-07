// Colori disponibili per tessuto. Sul materiale si salvano solo i codici del fornitore
// (come stampati sulla cartella: "99", "100", "02"). Ogni codice ha in ColoreFornitore due nomi:
// quello del fornitore (per ordinare) e il colore DOUBLEU (per clienti, filtri e abbinamenti tra
// fornitori: CTA 100 "Blu scuro" e NEOCAP 8 "Navy" sono entrambi Navy).

export interface VoceColore { id?: string; fornitore: string; codice: string; nome: string; hex: string | null; doubleu?: string | null }
export interface ColoreTessuto { codice: string; nome: string | null; hex: string | null; doubleu: string | null; soloQui?: boolean }
/** Nomi validi solo per un tessuto: prevalgono su quelli del fornitore (stesso codice, colore diverso). */
export type NomiTessuto = Record<string, { nome: string; hex: string | null; doubleu?: string | null }>;

/** Lista chiusa dei colori DOUBLEU, per famiglia: è il nome che vede il cliente. */
export const COLORI_DOUBLEU: { nome: string; hex: string; famiglia: string }[] = [
  ["Neutri", [["Nero", "#111111"], ["Antracite", "#4A4D52"], ["Grigio", "#8E9196"], ["Grigio chiaro", "#C9C9C6"], ["Bianco", "#FFFFFF"], ["Panna", "#F3EEDF"]]],
  ["Blu", [["Navy", "#1A2340"], ["Blu", "#22356E"], ["Blu royal", "#2048B8"], ["Azzurro", "#2A78D0"], ["Celeste", "#AFCDEB"], ["Petrolio", "#165A70"], ["Turchese", "#2AA0C8"], ["Acquamarina", "#8FD8D0"]]],
  ["Verdi", [["Verde bosco", "#23392C"], ["Verde bottiglia", "#1F6B4A"], ["Verde prato", "#3DB46A"], ["Verde militare", "#545C40"], ["Verde oliva", "#5E6B2E"], ["Salvia", "#8FA88E"], ["Lime", "#B4E33A"]]],
  ["Gialli e arancio", [["Giallo", "#F4DC1E"], ["Ocra", "#E8A93A"], ["Arancio", "#F07A35"]]],
  ["Rossi", [["Rosso", "#C8161F"], ["Bordeaux", "#6E1426"], ["Prugna", "#55203A"]]],
  ["Rosa e viola", [["Fucsia", "#D23A9C"], ["Rosa", "#F0A8C4"], ["Cipria", "#E2B3A2"], ["Lilla", "#A99BE0"], ["Viola", "#7A3FC8"]]],
  ["Marroni e beige", [["Testa di moro", "#3E2A22"], ["Marrone", "#6E4630"], ["Ruggine", "#9A4426"], ["Cammello", "#B98A5E"], ["Sabbia", "#D8C3A0"], ["Tortora", "#8C8178"]]],
].flatMap(([famiglia, colori]) => (colori as string[][]).map(([nome, hex]) => ({ nome, hex, famiglia: famiglia as string })));

export const FAMIGLIE_DOUBLEU = [...new Set(COLORI_DOUBLEU.map((c) => c.famiglia))];
export const hexDoubleu = (nome: string | null | undefined) => COLORI_DOUBLEU.find((c) => c.nome === nome)?.hex ?? null;

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

export function leggiNomiTessuto(json: string | null | undefined): NomiTessuto {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** Nomi del tessuto da salvare: solo i codici ancora presenti, null se non ce n'è nessuno. */
export function nomiTessutoJson(nomi: unknown, codici: string[]): string | null {
  if (!nomi || typeof nomi !== "object") return null;
  const puliti: NomiTessuto = {};
  for (const [codice, v] of Object.entries(nomi as Record<string, { nome?: unknown; hex?: unknown }>)) {
    const nome = typeof v?.nome === "string" ? v.nome.trim() : "";
    if (!nome || !codici.includes(codice)) continue;
    const doubleu = (v as { doubleu?: unknown }).doubleu;
    puliti[codice] = {
      nome,
      hex: typeof v.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(v.hex) ? v.hex : null,
      doubleu: typeof doubleu === "string" && hexDoubleu(doubleu) ? doubleu : null,
    };
  }
  return Object.keys(puliti).length ? JSON.stringify(puliti) : null;
}

export function coloriTessuto(codici: string[], diz: Map<string, VoceColore>, nomi: NomiTessuto = {}): ColoreTessuto[] {
  return codici.map((codice) => {
    const proprio = nomi[codice];
    if (proprio) return { codice, nome: proprio.nome, hex: proprio.hex, doubleu: proprio.doubleu ?? null, soloQui: true };
    const v = diz.get(codice);
    return { codice, nome: v?.nome ?? null, hex: v?.hex ?? null, doubleu: v?.doubleu ?? null };
  });
}

/** Nome che si dà al colore scelto in scheda: il colore DOUBLEU, altrimenti il nome del fornitore. */
export const nomeScheda = (c: ColoreTessuto) => c.doubleu ?? c.nome ?? "";

/**
 * Come va scritto il colore per il produttore: "Navy · NEOCAP col. 8" o, se il fornitore lo chiama
 * diversamente, "Navy · CTA col. 100 Blu scuro".
 */
export function etichettaColore(nome: string | null | undefined, codice: string | null | undefined, fornitore?: string | null, nomeFornitore?: string | null) {
  if (!codice) return nome || null;
  const proprio = nomeFornitore && nomeFornitore !== nome ? nomeFornitore : null;
  const rif = [chiaveFornitore(fornitore) || null, `col. ${codice}`, proprio].filter(Boolean).join(" ");
  return nome ? `${nome} · ${rif}` : rif;
}
