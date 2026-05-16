import { NextRequest, NextResponse } from "next/server";

// GET /api/layout?mode=desktop&redirect=/schede
// GET /api/layout?mode=tablet&redirect=/t/schede
// Sets or clears the force_desktop cookie then redirects
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");
  const redirect = req.nextUrl.searchParams.get("redirect") || "/";

  const res = NextResponse.redirect(new URL(redirect, req.url));

  if (mode === "desktop") {
    res.cookies.set("force_desktop", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  } else {
    res.cookies.delete("force_desktop");
  }

  return res;
}
