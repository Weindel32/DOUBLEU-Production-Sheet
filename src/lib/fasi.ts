// Avanzamento della produzione di una referenza: fasi fatto / non fatto, con la data della spunta.
// Una fase che per quell'articolo non esiste (es. niente stampa né ricamo) si salta e non conta.

export const FASI_PRODUZIONE = [
  { id: "cartamodello", label: "Cartamodello", breve: "Cartamodello", plurale: "al cartamodello" },
  { id: "tessuto", label: "Tessuto arrivato", breve: "Tessuto", plurale: "in attesa tessuto" },
  { id: "taglio", label: "Taglio", breve: "Taglio", plurale: "al taglio" },
  { id: "decorazione", label: "Stampa / Ricamo", breve: "Stampa/Ricamo", plurale: "in stampa/ricamo" },
  { id: "confezione", label: "Confezione", breve: "Confezione", plurale: "in confezione" },
  { id: "controllo", label: "Controllo qualità", breve: "Controllo", plurale: "al controllo" },
  { id: "pronto", label: "Pronto", breve: "Pronto", plurale: "in chiusura" },
] as const;

export type IdFase = (typeof FASI_PRODUZIONE)[number]["id"];

/** Valore salvato per fase: data della spunta (aaaa-mm-gg) oppure "salta". Fase assente = da fare. */
export type Fasi = Partial<Record<IdFase, string>>;

export const SALTA = "salta";

export function leggiFasi(json: string | null | undefined): Fasi {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Fasi) : {};
  } catch {
    return {};
  }
}

export interface Avanzamento {
  /** Fasi che contano per questo articolo (non saltate). */
  totali: number;
  fatte: number;
  /** Prima fase non ancora fatta; null = tutto fatto. */
  corrente: (typeof FASI_PRODUZIONE)[number] | null;
  completa: boolean;
  /** Giorni dalla fine della fase precedente: da quanto è ferma in quella attuale (null = nessuna data). */
  giorni: number | null;
}

/** Oltre questi giorni nella stessa fase l'articolo va sollecitato: in elenco diventa ambra. */
export const GIORNI_SOLLECITO = 7;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Giorni di calendario tra una data aaaa-mm-gg e oggi (ora italiana). */
export function giorniDa(iso: string) {
  const ms = Date.parse(`${oggiItalia()}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function avanzamento(fasi: Fasi): Avanzamento {
  const attive = FASI_PRODUZIONE.filter((f) => fasi[f.id] !== SALTA);
  const fatte = attive.filter((f) => !!fasi[f.id]).length;
  const corrente = attive.find((f) => !fasi[f.id]) ?? null;
  // La fase attuale parte dall'ultima spunta fatta prima di lei (es. taglio finito = consegnato al fasonista).
  const prima = corrente ? attive.slice(0, attive.indexOf(corrente)) : [];
  const date = prima.map((f) => fasi[f.id]!).filter((d) => ISO.test(d)).sort();
  const giorni = corrente && date.length ? giorniDa(date[date.length - 1]) : null;
  return { totali: attive.length, fatte, corrente, completa: corrente === null, giorni };
}

/** Oggi in ora italiana, aaaa-mm-gg: è la data che resta sulla spunta. */
export function oggiItalia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

/** "09/11" per la data di una fase. */
export const dataBreve = (iso: string) => (ISO.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");

/**
 * Riepilogo di un ordine: "4 in confezione · 2 al taglio · 13 pronte".
 * Contano solo le schede esecutive: le bozze non sono ancora in produzione.
 */
export function riepilogoFasi(elenco: Fasi[]): string {
  if (elenco.length === 0) return "";
  const conteggi = new Map<string, number>();
  const ferme = new Map<string, number>();
  let pronte = 0;
  for (const f of elenco) {
    const a = avanzamento(f);
    if (a.completa) { pronte++; continue; }
    const id = a.corrente!.id;
    conteggi.set(id, (conteggi.get(id) ?? 0) + 1);
    if (a.giorni !== null) ferme.set(id, Math.max(ferme.get(id) ?? 0, a.giorni));
  }
  // Solo quando qualcosa è fermo da più di una settimana: è lì che va sollecitato il fornitore.
  const parti = FASI_PRODUZIONE.filter((f) => conteggi.has(f.id)).reverse().map((f) => {
    const g = ferme.get(f.id) ?? 0;
    return `${conteggi.get(f.id)} ${f.plurale}${g >= GIORNI_SOLLECITO ? ` (fino a ${g} gg)` : ""}`;
  });
  if (pronte) parti.push(`${pronte} ${pronte === 1 ? "pronta" : "pronte"}`);
  return parti.join(" · ");
}
