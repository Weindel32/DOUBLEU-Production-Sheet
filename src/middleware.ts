import { NextRequest, NextResponse } from "next/server";

function isIpad(ua: string): boolean {
  // iPadOS ≤ 12 and most iPad browsers include "iPad" in UA
  // iPadOS 13+ with Safari reports as Macintosh unless "Request Desktop" is on
  if (ua.includes("iPad")) return true;
  // iPadOS 13+ heuristic: Macintosh + Apple WebKit + no Chrome/Firefox
  if (ua.includes("Macintosh") && ua.includes("AppleWebKit") && !ua.includes("Chrome") && !ua.includes("Firefox")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const user = process.env.AUTH_USER || "admin";
  const pass = process.env.AUTH_PASSWORD || "";

  const auth = req.headers.get("authorization");

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [u, p] = decoded.split(":");
      if (u === user && p === pass) {
        const ua = req.headers.get("user-agent") || "";
        const pathname = req.nextUrl.pathname;

        // Tablet redirect: iPad users on non-/t/ routes → /t/schede
        // Skip if already on /t/, /m/, /api/, or forced to desktop via cookie
        const forceDesktop = req.cookies.get("force_desktop")?.value === "1";
        if (!forceDesktop && isIpad(ua) && !pathname.startsWith("/t/") && !pathname.startsWith("/m/") && !pathname.startsWith("/api/")) {
          const url = req.nextUrl.clone();
          url.pathname = "/t/schede";
          return NextResponse.redirect(url);
        }

        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Accesso non autorizzato", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Double U Production Sheet"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-).*)"],
};
