// Tempi di produzione di un ordine: si parte dalla ricezione delle taglie del club
// e si contano i giorni lavorativi (lunedì-venerdì, festività nazionali escluse).
// Date "solo giorno" come stringhe aaaa-mm-gg, per non avere sorprese di fuso orario.

export const GIORNI_PRODUZIONE_DEFAULT = 30;

const giorno = (d: Date) => d.toISOString().slice(0, 10);
const daStringa = (s: string) => new Date(`${s}T00:00:00Z`);
const piu = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/** Domenica di Pasqua (algoritmo di Meeus/Jones/Butcher). */
function pasqua(anno: number) {
  const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31), gg = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anno, mese - 1, gg));
}

const FESTE_FISSE = ["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-25", "12-26"];

export function lavorativo(d: Date) {
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  if (FESTE_FISSE.includes(giorno(d).slice(5))) return false;
  return giorno(d) !== giorno(piu(pasqua(d.getUTCFullYear()), 1)); // Lunedì dell'Angelo
}

/** Il giorno (Europe/Rome) di un istante: le taglie arrivate alle 23:30 italiane sono di quel giorno. */
export function giornoItaliano(istante: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date(istante));
}

/**
 * Primo giorno di produzione: taglie ricevute da lunedì a mercoledì → giorno lavorativo dopo;
 * da giovedì a domenica → lunedì successivo (o il primo lavorativo, se è festa).
 */
export function inizioDaRicezione(ricezione: string) {
  const r = daStringa(ricezione);
  const dow = r.getUTCDay();
  let d = dow >= 1 && dow <= 3 ? piu(r, 1) : piu(r, ((8 - dow) % 7) || 7);
  while (!lavorativo(d)) d = piu(d, 1);
  return giorno(d);
}

/** Ultimo giorno di produzione: `giorni` lavorativi contando il primo come giorno 1. */
export function fineProduzione(inizio: string, giorni: number) {
  let d = daStringa(inizio);
  while (!lavorativo(d)) d = piu(d, 1);
  for (let contati = 1; contati < giorni; ) {
    d = piu(d, 1);
    if (lavorativo(d)) contati++;
  }
  return giorno(d);
}

/** gg/mm/aaaa (Order App) → aaaa-mm-gg. */
export const daDataItaliana = (s: string | null) => {
  const m = s?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};

/** aaaa-mm-gg → gg/mm/aaaa. */
export const inItaliano = (s: string) => s.split("-").reverse().join("/");

export interface PianoProduzione {
  /** Ricezione delle taglie (giorno italiano), dal modulo del club. */
  ricezione: string | null;
  /** Primo giorno di produzione: scelto a mano, altrimenti calcolato dalla ricezione. */
  inizio: string | null;
  inizioManuale: boolean;
  giorni: number;
  /** Ultimo giorno di produzione (pronto). */
  pronto: string | null;
  /** Giorni di calendario oltre la consegna promessa (>0 = in ritardo), null senza consegna o senza piano. */
  ritardo: number | null;
}

export function pianoProduzione({ ricezione, inizioManuale, giorni, consegna }: {
  ricezione: string | null; inizioManuale: string | null; giorni: number | null; consegna: string | null;
}): PianoProduzione {
  const g = giorni && giorni > 0 ? giorni : GIORNI_PRODUZIONE_DEFAULT;
  const inizio = inizioManuale ?? (ricezione ? inizioDaRicezione(ricezione) : null);
  const pronto = inizio ? fineProduzione(inizio, g) : null;
  const promessa = daDataItaliana(consegna);
  const ritardo = pronto && promessa ? Math.round((daStringa(pronto).getTime() - daStringa(promessa).getTime()) / 86_400_000) : null;
  return { ricezione, inizio, inizioManuale: !!inizioManuale, giorni: g, pronto, ritardo };
}
