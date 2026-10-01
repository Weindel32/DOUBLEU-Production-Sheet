import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSIONE, sessioneValida } from "@/lib/auth";

// Raggiungibili senza sessione: la pagina di accesso e la sua API.
const PUBBLICI = ["/login", "/api/login"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBBLICI.includes(pathname)) return NextResponse.next();

  if (await sessioneValida(req.cookies.get(COOKIE_SESSIONE)?.value)) return NextResponse.next();

  // Le API rispondono 401 (le chiama il codice, non una persona); le pagine portano al login.
  if (pathname.startsWith("/api/"))
    return NextResponse.json({ error: "Sessione scaduta: accedi di nuovo" }, { status: 401 });

  const login = new URL("/login", req.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest|icon-|apple-touch-icon).*)"],
};
