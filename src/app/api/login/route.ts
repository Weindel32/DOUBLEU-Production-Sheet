import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSIONE, DURATA_SESSIONE_S, credenzialiValide, creaSessione } from "@/lib/auth";

// Blocco dopo troppi tentativi sbagliati dallo stesso indirizzo: 10 errori in
// 15 minuti e il login risponde 429 fino alla fine della finestra. Il conteggio
// vive nella memoria dell'istanza serverless (come in Finance): non è condiviso
// fra istanze né sopravvive a un riavvio, ma basta a fermare i tentativi a
// raffica, che arrivano tutti alla stessa istanza calda.
const FINESTRA_MS = 15 * 60 * 1000;
const MAX_ERRORI = 10;
const errori = new Map<string, { n: number; finoA: number }>();

function ipDi(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "sconosciuto";
}

function bloccato(ip: string, ora: number): boolean {
  const r = errori.get(ip);
  if (r && ora > r.finoA) errori.delete(ip);
  return (errori.get(ip)?.n ?? 0) >= MAX_ERRORI;
}

function segnaErrore(ip: string, ora: number) {
  const r = errori.get(ip);
  if (!r || ora > r.finoA) errori.set(ip, { n: 1, finoA: ora + FINESTRA_MS });
  else r.n++;
  // Pulizia occasionale delle voci scadute, per non far crescere la mappa
  if (errori.size > 1000) for (const [k, v] of errori) if (ora > v.finoA) errori.delete(k);
}

export async function POST(req: NextRequest) {
  const ip = ipDi(req);
  const ora = Date.now();
  if (bloccato(ip, ora)) {
    return NextResponse.json(
      { error: "Troppi tentativi sbagliati. Riprova tra 15 minuti." },
      { status: 429, headers: { "Retry-After": String(FINESTRA_MS / 1000) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const utente = typeof body.utente === "string" ? body.utente.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!credenzialiValide(utente, password)) {
    segnaErrore(ip, ora);
    // Mezzo secondo di attesa sugli errori: rende inutili i tentativi a raffica.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Utente o password non corretti" }, { status: 401 });
  }

  errori.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESSIONE, await creaSessione(utente), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATA_SESSIONE_S,
  });
  return res;
}
