import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSIONE, DURATA_SESSIONE_S, credenzialiValide, creaSessione } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const utente = typeof body.utente === "string" ? body.utente.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!credenzialiValide(utente, password)) {
    // Mezzo secondo di attesa sugli errori: rende inutili i tentativi a raffica.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Utente o password non corretti" }, { status: 401 });
  }

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
