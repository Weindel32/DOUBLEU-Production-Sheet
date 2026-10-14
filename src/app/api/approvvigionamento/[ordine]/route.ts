import { NextRequest, NextResponse } from "next/server";
import { acquistiOrdine } from "@/lib/approvvigionamentoServer";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import { SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";

const esc = (t: string | null | undefined) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

/**
 * PDF approvvigionamento di un ordine (HTML da stampare, come la scheda): una pagina per fornitore.
 * ?prezzi=1 versione interna (stime, club, referenze); ?prezzi=0 versione da mandare al fornitore.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ ordine: string }> }) {
  const { ordine: id } = await params;
  const ordineId = decodeURIComponent(id);
  const interno = req.nextUrl.searchParams.get("prezzi") !== "0";
  const { ordine, cliente, riepilogo } = await acquistiOrdine(ordineId);
  if (riepilogo.fornitori.length === 0)
    return NextResponse.json({ error: "Niente da acquistare: mancano quantità o consumi nelle schede dell'ordine" }, { status: 404 });

  const oggi = new Date().toLocaleDateString("it-IT");
  const pagine = riepilogo.fornitori.map((g) => {
    const righe = g.righe.map((r) => {
      const a = r.acquisto;
      const netto = a?.unita === "kg" ? `${num1(a.metri!)} m = ${num1(a.netto)} kg` : `${num1(r.quantitaNetta)} ${a?.unita ?? "m"}`;
      return `<tr>
        <td><div class="b">${esc(r.materiale.nome)}</div>${r.materiale.codice ? `<div class="small">art. ${esc(r.materiale.codice)}</div>` : ""}</td>
        <td>${r.coloreEtichetta ? esc(r.coloreEtichetta) : '<span class="warn">da definire</span>'}</td>
        ${interno ? `<td class="r mono muted">${netto}</td>` : ""}
        <td class="r mono b big">${a ? quantitaAcquisto(a) : '<span class="warn">manca peso/altezza</span>'}</td>
        ${interno ? `<td class="r mono">${a?.stima != null ? formatEuro(a.stima) : '<span class="warn">manca il prezzo</span>'}</td>` : ""}
        ${interno ? `<td class="small">${r.referenze.map((x) => esc(x.nomeArticolo)).join(", ")}</td>` : ""}
      </tr>`;
    }).join("");
    return `<section class="page">
      <div class="header">
        <div>
          <div class="brand">DOUBLE U</div>
          <div class="brand-sub">HANDCRAFTED IN ITALY</div>
          <div class="flag"><div style="background:#009246"></div><div style="background:#fff;border:1px solid #eee"></div><div style="background:#ce2b37"></div></div>
        </div>
        <div class="r">
          <span class="tag ${interno ? "tag-int" : "tag-forn"}">${interno ? "DOCUMENTO INTERNO RISERVATO" : "RICHIESTA MATERIALI"}</span>
          <div class="small" style="margin-top:6px">Data: ${oggi}</div>
        </div>
      </div>
      <div class="meta">
        <div><div class="label">Fornitore</div><div class="value big">${esc(g.fornitore || "Fornitore non indicato")}</div></div>
        <div><div class="label">Rif. ordine DOUBLEU</div><div class="value mono">${esc(ordineId)}</div></div>
        ${interno && cliente ? `<div><div class="label">Club</div><div class="value">${esc(cliente)}</div></div>` : ""}
        ${interno && ordine?.stato ? `<div><div class="label">Stato ordine</div><div class="value">${esc(statoOrdine(ordine.stato))}</div></div>` : ""}
      </div>
      <table>
        <thead><tr>
          <th>Articolo</th><th>Colore</th>
          ${interno ? '<th class="r">Netto</th>' : ""}
          <th class="r">Quantità</th>
          ${interno ? '<th class="r">Stima</th><th>Referenze</th>' : ""}
        </tr></thead>
        <tbody>${righe}</tbody>
        ${interno ? `<tfoot><tr><td colspan="4" class="r b">Totale ${esc(g.fornitore || "fornitore")}${g.senzaPrezzo ? ` <span class="warn">(${g.senzaPrezzo} senza prezzo)</span>` : ""}</td><td class="r mono b">${formatEuro(g.stima)}</td><td></td></tr></tfoot>` : ""}
      </table>
      <p class="note">${interno
        ? `Quantità dei tessuti con ${SCARTO_ACQUISTO * 100}% di scarto, arrotondate per eccesso. Stime sui prezzi in anagrafica materiali.`
        : "Quantità da fornire. Per conferma disponibilità e tempi di consegna fare riferimento al numero d'ordine DOUBLEU."}</p>
      <div class="footer"><span>Double U &ndash; Handcrafted in Italy &middot; Approvvigionamento ${esc(ordineId)}</span><span>Stampato il ${oggi}</span></div>
    </section>`;
  }).join("");

  const totale = interno && riepilogo.fornitori.length > 1
    ? `<section class="page"><div class="meta"><div><div class="label">Totale acquisti stimato · ${esc(cliente ?? "")} · ${esc(ordineId)}</div><div class="value big mono">${formatEuro(riepilogo.totale)}</div></div></div>
       <table><tbody>${riepilogo.fornitori.map((g) => `<tr><td>${esc(g.fornitore || "Fornitore non indicato")}</td><td class="r mono">${formatEuro(g.stima)}</td></tr>`).join("")}</tbody></table></section>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8">
<title>Approvvigionamento ${esc(ordineId)}${interno ? "" : " – fornitori"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px; }
  .page { page-break-after: always; margin-bottom: 32px; }
  .page:last-child { page-break-after: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #1a2236; }
  .brand { font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #1a2236; }
  .brand-sub { font-size: 9px; letter-spacing: 3px; color: #666; }
  .flag { display: flex; gap: 2px; margin-top: 4px; } .flag div { height: 3px; width: 20px; }
  .tag { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; }
  .tag-int { background: #fef3c7; color: #92400e; } .tag-forn { background: #dbeafe; color: #1d4ed8; }
  .meta { display: flex; gap: 28px; margin-bottom: 16px; }
  .label { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-weight: 600; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f6f9; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
  td { padding: 7px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tfoot td { border-top: 1px solid #ddd; border-bottom: 0; }
  .r { text-align: right; } .b { font-weight: 700; } .big { font-size: 15px; } .mono { font-family: "Courier New", monospace; }
  .small { font-size: 10px; color: #666; } .muted { color: #666; } .warn { color: #a8461f; font-size: 11px; }
  .note { margin-top: 12px; font-size: 10px; color: #666; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #999; font-size: 9px; }
</style></head>
<body>${pagine}${totale}</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
