import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSIONE } from "@/lib/auth";

function esci(res: NextResponse) {
  res.cookies.set(COOKIE_SESSIONE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function POST() {
  return esci(NextResponse.json({ ok: true }));
}

// Aprendo /api/logout dal browser si esce e si torna alla pagina di accesso.
export async function GET(req: NextRequest) {
  return esci(NextResponse.redirect(new URL("/login", req.url)));
}
