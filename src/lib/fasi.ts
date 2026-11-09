// Avanzamento della produzione di una referenza. Ogni fase è vuota, in corso (dal giorno X) o fatta
// (il giorno Y). Nessun ordine obbligato: stampa e ricamo possono venire dopo la confezione.
// Una fase che per quell'articolo non esiste si segna "non serve" ed esce dal conteggio.
// "Pronto" non è una fase: lo è l'articolo quando tutte le fasi previste sono fatte.

export const FASI_PRODUZIONE = [
  { id: "cartamodello", label: "Cartamodello", breve: "Cartamodello", plurale: "al cartamodello" },
  { id: "tessuto", label: "Tessuto", breve: "Tessuto", plurale: "tessuto in arrivo" },
  { id: "taglio", label: "Taglio", breve: "Taglio", plurale: "al taglio" },
  { id: "confezione", label: "Confezione", breve: "Confezione", plurale: "in confezione" },
  { id: "decorazione", label: "Stampa / Ricamo", breve: "Stampa/Ricamo", plurale: "in stampa/ricamo" },
  { id: "controllo", label: "Controllo qualità", breve: "Controllo", plurale: "al controllo" },
] as const;

export type Fase = (typeof FASI_PRODUZIONE)[number];
export type IdFase = Fase["id"];

/**
 * Valore salvato per fase: {inizio?, fine?} con date aaaa-mm-gg, oppure "salta".
 * Una data sola ("aaaa-mm-gg") è il formato della prima versione: vale come fatta quel giorno.
 */
export type ValoreFase = "salta" | string | { inizio?: string; fine?: string };
export type Fasi = Partial<Record<IdFase, ValoreFase>>;

export const SALTA = "salta";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type StatoFase =
  | { stato: "vuota" }
  | { stato: "salta" }
  | { stato: "corso"; inizio: string }
  | { stato: "fatta"; inizio?: string; fine: string };

export function statoFase(v: ValoreFase | undefined): StatoFase {
  if (v === SALTA) return { stato: "salta" };
  if (typeof v === "string") return ISO.test(v) ? { stato: "fatta", fine: v } : { stato: "vuota" };
  if (v && typeof v === "object") {
    if (v.fine && ISO.test(v.fine)) return { stato: "fatta", fine: v.fine, inizio: v.inizio };
    if (v.inizio && ISO.test(v.inizio)) return { stato: "corso", inizio: v.inizio };
  }
  return { stato: "vuota" };
}

export function leggiFasi(json: string | null | undefined): Fasi {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Fasi) : {};
  } catch {
    return {};
  }
}

/** Oggi in ora italiana, aaaa-mm-gg. */
export function oggiItalia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

/** Giorni di calendario tra una data aaaa-mm-gg e oggi (ora italiana). */
export function giorniDa(iso: string) {
  const ms = Date.parse(`${oggiItalia()}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Giorni di calendario tra due date aaaa-mm-gg. */
export function giorniTra(da: string, a: string) {
  return Math.max(0, Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${da}T00:00:00Z`)) / 86_400_000));
}

/** Durata di una fase fatta: solo se è partita con la sua data (in corso → fatta). */
export function durataFase(s: StatoFase) {
  return s.stato === "fatta" && s.inizio ? giorniTra(s.inizio, s.fine) : null;
}

/** Prima data registrata (partenza o fine) e ultima fine: l'arco della produzione. */
function arco(fasi: Fasi) {
  const stati = FASI_PRODUZIONE.map((f) => statoFase(fasi[f.id]));
  const date = stati.flatMap((s) => (s.stato === "corso" ? [s.inizio] : s.stato === "fatta" ? [s.inizio, s.fine] : [])).filter((d): d is string => !!d).sort();
  const fini = stati.flatMap((s) => (s.stato === "fatta" ? [s.fine] : [])).sort();
  return { primo: date[0] ?? null, ultimaFine: fini[fini.length - 1] ?? null };
}

/** "06/11" */
export const dataBreve = (iso: string) => (ISO.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");

/** Oltre questi giorni fermo nello stesso punto l'articolo va sollecitato: diventa arancione. */
export const GIORNI_SOLLECITO = 7;

export type Situazione = "corso" | "attesa" | "pronto" | "da-avviare";

export interface Avanzamento {
  totali: number;
  fatte: number;
  situazione: Situazione;
  /** Fase in corso (la partita più di recente, se sono più d'una). */
  inCorso: Fase | null;
  /** Etichetta breve per gli elenchi: "Confezione", "In attesa", "Pronto", "Da avviare". */
  etichetta: string;
  /** In corso: giorni dalla partenza. In attesa: giorni dall'ultima fase finita. */
  giorni: number | null;
  /** Pronto: giorni impiegati dalla prima partenza all'ultima fine (storico dei tempi). */
  impiegati: number | null;
}

export function avanzamento(fasi: Fasi): Avanzamento {
  const righe = FASI_PRODUZIONE.map((f) => ({ f, s: statoFase(fasi[f.id]) })).filter((r) => r.s.stato !== "salta");
  const totali = righe.length;
  const fatte = righe.filter((r) => r.s.stato === "fatta").length;
  const corso = righe
    .flatMap((r) => (r.s.stato === "corso" ? [{ f: r.f, inizio: r.s.inizio }] : []))
    .sort((a, b) => b.inizio.localeCompare(a.inizio))[0];

  const base = { totali, fatte, inCorso: null, giorni: null, impiegati: null };
  if (corso) return { ...base, situazione: "corso", inCorso: corso.f, etichetta: corso.f.breve, giorni: giorniDa(corso.inizio) };
  if (totali > 0 && fatte === totali) {
    const { primo, ultimaFine } = arco(fasi);
    return { ...base, situazione: "pronto", etichetta: "Pronto", impiegati: primo && ultimaFine ? giorniTra(primo, ultimaFine) : null };
  }
  if (fatte === 0) return { ...base, situazione: "da-avviare", etichetta: "Da avviare" };
  const ultima = righe.flatMap((r) => (r.s.stato === "fatta" ? [r.s.fine] : [])).sort().pop()!;
  return { ...base, situazione: "attesa", etichetta: "In attesa", giorni: giorniDa(ultima) };
}

/**
 * Riepilogo di un ordine, prima ciò che è in lavorazione: "3 in confezione (fino a 12 gg) · 2 in attesa · 4 pronte".
 * Contano solo le schede esecutive: le bozze non sono ancora in produzione.
 */
export function riepilogoFasi(elenco: Fasi[]): string {
  if (elenco.length === 0) return "";
  const conta = new Map<string, { n: number; max: number }>();
  const aggiungi = (k: string, giorni: number | null) => {
    const c = conta.get(k) ?? { n: 0, max: 0 };
    conta.set(k, { n: c.n + 1, max: Math.max(c.max, giorni ?? 0) });
  };
  for (const f of elenco) {
    const a = avanzamento(f);
    aggiungi(a.situazione === "corso" ? a.inCorso!.id : a.situazione, a.giorni);
  }
  // I giorni solo quando qualcosa è fermo da più di una settimana: è lì che va sollecitato.
  const voce = (k: string, testo: string) => {
    const c = conta.get(k);
    return c ? [`${c.n} ${testo}${c.max >= GIORNI_SOLLECITO ? ` (fino a ${c.max} gg)` : ""}`] : [];
  };
  const pronte = conta.get("pronto")?.n ?? 0;
  return [
    ...FASI_PRODUZIONE.flatMap((f) => voce(f.id, f.plurale)),
    ...voce("attesa", "in attesa"),
    ...voce("da-avviare", "da avviare"),
    ...(pronte ? [`${pronte} ${pronte === 1 ? "pronta" : "pronte"}`] : []),
  ].join(" · ");
}

/**
 * Tempo dell'ordine: "Prodotto in 24 giorni" quando tutte le referenze sono pronte (e nessuna è
 * più in bozza), altrimenti "In produzione da 12 giorni" dalla prima fase partita.
 */
export function tempoOrdine(elenco: Fasi[], senzaBozze: boolean): { testo: string; chiuso: boolean } | null {
  const archi = elenco.map(arco);
  const primi = archi.flatMap((a) => (a.primo ? [a.primo] : [])).sort();
  if (!primi.length) return null;
  const chiuso = senzaBozze && elenco.length > 0 && elenco.every((f) => avanzamento(f).situazione === "pronto");
  if (chiuso) {
    const fine = archi.flatMap((a) => (a.ultimaFine ? [a.ultimaFine] : [])).sort().pop()!;
    const g = giorniTra(primi[0], fine);
    return { testo: `Prodotto in ${g} ${g === 1 ? "giorno" : "giorni"}`, chiuso };
  }
  const g = giorniDa(primi[0]);
  return { testo: `In produzione da ${g === 0 ? "oggi" : g === 1 ? "1 giorno" : `${g} giorni`}`, chiuso };
}
