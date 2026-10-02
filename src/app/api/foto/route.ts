import { NextRequest, NextResponse } from "next/server";

// Rilegge una foto già caricata per poterla ritagliare di nuovo nel browser.
// Solo dallo storage Vercel Blob, così la route non diventa un proxy verso qualsiasi sito.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  let host = "";
  try { host = new URL(url ?? "").hostname; } catch {}
  if (!url || !host.endsWith(".blob.vercel-storage.com"))
    return NextResponse.json({ error: "Foto non valida" }, { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  return new NextResponse(res.body, {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=300" },
  });
}
