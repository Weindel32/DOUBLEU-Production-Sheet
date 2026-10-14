import { NextRequest, NextResponse } from "next/server";
import { acquistiOrdine } from "@/lib/approvvigionamentoServer";
import { creaPdfApprovvigionamento } from "@/lib/pdf/approvvigionamentoPdf";

/**
 * PDF approvvigionamento di un ordine (file vero: su iPhone si condivide o stampa dal foglio di iOS).
 * ?prezzi=1 versione interna (dettaglio, stime, club); ?prezzi=0 lista acquisti senza prezzi, una pagina per fornitore.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ ordine: string }> }) {
  const ordineId = decodeURIComponent((await params).ordine);
  const interno = req.nextUrl.searchParams.get("prezzi") !== "0";
  const dati = await acquistiOrdine(ordineId);
  if (dati.riepilogo.fornitori.length === 0)
    return NextResponse.json({ error: "Niente da acquistare: mancano quantità o consumi nelle schede dell'ordine" }, { status: 404 });

  const pdf = await creaPdfApprovvigionamento(dati, interno);
  const nome = `${interno ? "Approvvigionamento" : "Lista acquisti"} ${ordineId}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome.replace(/[^\w .-]/g, "")}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "no-store",
    },
  });
}
