// Sessione di accesso: cookie firmato con HMAC-SHA256 (Web Crypto, funziona anche nel middleware).
// Le credenziali restano AUTH_USER / AUTH_PASSWORD. La chiave di firma è AUTH_SECRET se c'è,
// altrimenti è ricavata dalla password: nessuna variabile nuova obbligatoria, e cambiare la
// password invalida tutte le sessioni aperte.

export const COOKIE_SESSIONE = "du_sessione";
export const DURATA_SESSIONE_S = 30 * 24 * 60 * 60; // 30 giorni: su iPad non si rientra ogni giorno

const enc = new TextEncoder();

function utenteAtteso(): string {
  return process.env.AUTH_USER || "admin";
}

function passwordAttesa(): string {
  return process.env.AUTH_PASSWORD || "";
}

function chiaveFirma(): string {
  return process.env.AUTH_SECRET || `du-production-sheet|${utenteAtteso()}|${passwordAttesa()}`;
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Confronto a tempo costante: non rivela quanti caratteri iniziali coincidono. */
function uguali(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function firma(testo: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(chiaveFirma()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, enc.encode(testo)));
}

export function credenzialiValide(utente: string, password: string): boolean {
  // Entrambi i confronti sempre eseguiti: stesso tempo con utente giusto o sbagliato.
  const okUtente = uguali(utente, utenteAtteso());
  const okPassword = uguali(password, passwordAttesa());
  return okUtente && okPassword;
}

export async function creaSessione(utente: string): Promise<string> {
  const scadenza = Math.floor(Date.now() / 1000) + DURATA_SESSIONE_S;
  const payload = base64url(enc.encode(`${utente}|${scadenza}`));
  return `${payload}.${await firma(payload)}`;
}

export async function sessioneValida(valore: string | undefined): Promise<boolean> {
  if (!valore) return false;
  const [payload, sig] = valore.split(".");
  if (!payload || !sig) return false;
  if (!uguali(sig, await firma(payload))) return false;
  try {
    const [utente, scadenza] = atob(payload.replace(/-/g, "+").replace(/_/g, "/")).split("|");
    return utente === utenteAtteso() && Number(scadenza) > Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Vecchio accesso Basic Auth (popup del browser): accettato ancora per non chiudere fuori nessuno. */
export function basicAuthValida(header: string | null): boolean {
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    return i > 0 && credenzialiValide(decoded.slice(0, i), decoded.slice(i + 1));
  } catch {
    return false;
  }
}

/** Solo percorsi interni: niente redirect verso altri siti dopo il login. */
export function percorsoSicuro(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
