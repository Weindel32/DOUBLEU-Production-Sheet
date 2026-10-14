import { NextRequest, NextResponse } from "next/server";
import { acquistiOrdine } from "@/lib/approvvigionamentoServer";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import { SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";

const esc = (t: string | null | undefined) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
const num2 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 });

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
  const intestazione = (titolo: string, campi: [string, string | null | undefined][]) => `
      <div class="header">
        <div>
          <div class="brand">DOUBLE U</div>
          <div class="brand-sub">HANDCRAFTED IN ITALY</div>
          <div class="flag"><div style="background:#009246"></div><div style="background:#fff;border:1px solid #eee"></div><div style="background:#ce2b37"></div></div>
        </div>
        <div class="r">
          <span class="tag ${interno ? "tag-int" : "tag-forn"}">${titolo}</span>
          <div class="small" style="margin-top:6px">Data: ${oggi}</div>
        </div>
      </div>
      <div class="meta">${campi.filter(([, v]) => v).map(([l, v]) => `<div><div class="label">${l}</div><div class="value">${esc(v)}</div></div>`).join("")}</div>`;

  const tabellaFornitore = (g: (typeof riepilogo.fornitori)[number]) => `
      <table>
        ${interno
          ? '<colgroup><col style="width:30%"><col style="width:28%"><col><col style="width:11%"><col style="width:14%"></colgroup>'
          : '<colgroup><col style="width:40%"><col><col style="width:18%"></colgroup>'}
        <thead><tr><th>Articolo</th><th>Colore</th>${interno ? '<th class="r">Netto</th>' : ""}<th class="r">Quantità</th>${interno ? '<th class="r">Stima</th>' : ""}</tr></thead>
        <tbody>${g.righe.map((r) => {
          const a = r.acquisto;
          const netto = !interno ? "" : a?.unita === "kg" ? `${num1(a.metri!)} m = ${num1(a.netto)} kg` : `${num1(r.quantitaNetta)} ${a?.unita ?? "m"}`;
          return `<tr>
            <td><div class="b">${esc(r.materiale.nome)}</div>${r.materiale.codice ? `<div class="small">art. ${esc(r.materiale.codice)}</div>` : ""}</td>
            <td>${r.coloreEtichetta ? esc(r.coloreEtichetta) : '<span class="warn">da definire</span>'}</td>
            ${interno ? `<td class="r mono muted">${netto}</td>` : ""}
            <td class="r mono b big">${a ? quantitaAcquisto(a) : '<span class="warn">manca peso/altezza</span>'}</td>
            ${interno ? `<td class="r mono">${a?.stima != null ? formatEuro(a.stima) : '<span class="warn">manca il prezzo</span>'}</td>` : ""}
          </tr>`;
        }).join("")}</tbody>
        ${interno ? `<tfoot><tr><td colspan="4" class="r b">Totale ${esc(g.fornitore || "fornitore")}${g.senzaPrezzo ? ` <span class="warn">(${g.senzaPrezzo} senza prezzo)</span>` : ""}</td><td class="r mono b">${formatEuro(g.stima)}</td></tr></tfoot>` : ""}
      </table>`;

  const piede = `<div class="footer"><span>Double U &ndash; Handcrafted in Italy &middot; Approvvigionamento ${esc(ordineId)}</span><span>Stampato il ${oggi}</span></div>`;

  let corpo: string;
  if (interno) {
    // Interno: prima cosa consuma ogni referenza (netto), poi cosa si compra (totale per fornitore).
    const dettaglio = riepilogo.referenze.map((d) => `
      <div class="ref">
        <div class="ref-head"><span class="b">${esc(d.nomeArticolo)}</span><span class="small mono">${esc(d.codice)} &middot; ${d.capi} capi</span></div>
        <table><tbody>${d.righe.map((r) => {
          const n = r.netto;
          const q = !n ? `${num1(r.quantita)} m` : n.unita === "kg" ? `${num1(n.metri!)} m = ${num1(n.netto)} kg` : `${num1(n.netto)} ${n.unita}`;
          return `<tr>
            <td style="width:30%"><span class="b">${esc(r.materiale.nome)}</span></td>
            <td style="width:28%">${r.coloreEtichetta ? esc(r.coloreEtichetta) : '<span class="warn">da definire</span>'}</td>
            <td class="small">${num2(r.consumoPerCapo)} ${n?.unita === "pz" ? "pz" : "m"}/capo</td>
            <td class="r mono">${q}</td>
            <td class="r mono muted" style="width:14%">${n?.costo != null ? formatEuro(n.costo) : ""}</td>
          </tr>`;
        }).join("")}</tbody></table>
      </div>`).join("");
    const avvisi = riepilogo.escluse.length
      ? `<p class="warn" style="margin:6px 0 0">Fuori dal conto: ${riepilogo.escluse.map((e) => `${esc(e.nomeArticolo)} (${esc(e.motivo)})`).join("; ")}</p>` : "";
    corpo = `<section>
      ${intestazione("DOCUMENTO INTERNO RISERVATO", [["Club", cliente], ["Ordine DOUBLEU", ordineId], ["Stato ordine", ordine?.stato ? statoOrdine(ordine.stato) : null]])}
      <h3>Dettaglio per referenza <span class="small">(netto, senza scarto)</span></h3>
      ${dettaglio}${avvisi}
      <h3 style="margin-top:22px">Totale da acquistare <span class="small">(tessuti +${SCARTO_ACQUISTO * 100}% di scarto, arrotondati per eccesso)</span></h3>
      ${riepilogo.fornitori.map((g) => `<div class="forn"><div class="forn-head">${esc(g.fornitore || "Fornitore non indicato")}</div>${tabellaFornitore(g)}</div>`).join("")}
      <div class="grand"><span>Totale acquisti stimato${riepilogo.senzaPrezzo ? ` <span class="warn">(${riepilogo.senzaPrezzo} senza prezzo, esclusi)</span>` : ""}</span><span class="mono">${formatEuro(riepilogo.totale)}</span></div>
      <p class="note">Stime sui prezzi in anagrafica materiali.</p>
      ${piede}
    </section>`;
  } else {
    // Fornitore: una pagina ciascuno, solo quello che deve fornire.
    corpo = riepilogo.fornitori.map((g) => `<section class="page">
      ${intestazione("RICHIESTA MATERIALI", [["Fornitore", g.fornitore || "Fornitore non indicato"], ["Rif. ordine DOUBLEU", ordineId]])}
      ${tabellaFornitore(g)}
      <p class="note">Quantità da fornire. Per conferma disponibilità e tempi di consegna fare riferimento al numero d'ordine DOUBLEU.</p>
      ${piede}
    </section>`).join("");
  }

  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8">
<title>Approvvigionamento ${esc(ordineId)}${interno ? " – interno" : " – fornitori"}</title>
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
  h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #1a2236; margin: 4px 0 10px; }
  h3 .small { text-transform: none; letter-spacing: 0; font-weight: 400; }
  .ref { border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 10px; page-break-inside: avoid; }
  .ref-head { display: flex; justify-content: space-between; align-items: baseline; background: #f9fafb; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  .ref td { border-bottom: 1px solid #f3f4f6; } .ref tr:last-child td { border-bottom: 0; }
  .forn { margin-bottom: 14px; page-break-inside: avoid; }
  .forn-head { font-weight: 800; font-size: 14px; color: #1a2236; padding: 4px 0 6px; }
  .grand { display: flex; justify-content: space-between; border-top: 2px solid #1a2236; padding-top: 8px; margin-top: 6px; font-weight: 700; font-size: 15px; }
  table { table-layout: fixed; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #999; font-size: 9px; }
</style></head>
<body>${corpo}</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
