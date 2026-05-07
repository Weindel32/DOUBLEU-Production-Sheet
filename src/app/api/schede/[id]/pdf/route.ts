import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORIE_ELASTICO } from "@/lib/utils";
import type { ConsumoMateriale } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tipo = req.nextUrl.searchParams.get("tipo") || "tecnico";

  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true, loghi: { include: { logo: true } }, materiali: { include: { materiale: true } } },
  });

  if (!scheda) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  const tabellaMisure = scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {};
  const quantitaTaglia = scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {};
  const allegati = scheda.allegati ? JSON.parse(scheda.allegati) : [];
  const consumi = scheda.consumoMateriale ? JSON.parse(scheda.consumoMateriale) : [];
  const immagini: string[] = scheda.immagini ? JSON.parse(scheda.immagini) : [];
  const totalePezzi = Object.values(quantitaTaglia as Record<string, number>).reduce((s, q) => s + q, 0);

  const isInterno = tipo === "interno";

  function renderColoreSecondarioPdf(raw: string | null | undefined): string {
    if (!raw) return "—";
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr
          .map((v: { colore: string; destinazione: string; altroTesto?: string }) => {
            const dest =
              v.destinazione === "Altro" && v.altroTesto ? v.altroTesto : v.destinazione;
            return dest ? `${v.colore} (${dest})` : v.colore;
          })
          .join(", ");
      }
    } catch {
      // plain string fallback
    }
    return raw;
  }

  const taglie = Object.keys(quantitaTaglia);
  const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
  const specsElastico = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;

  const costoMaterialePerCapo = consumi.reduce(
    (sum: number, c: { consumoPerCapo: number; costoUnitario?: number }) =>
      sum + c.consumoPerCapo * (c.costoUnitario || 0),
    0
  );
  const costoTotalePerCapo = costoMaterialePerCapo + (scheda.costoLavorazione || 0);

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${tipo === "interno" ? "Scheda Interna" : "Scheda Tecnica"} – ${scheda.nomeArticolo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1a2236; }
  .brand { font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #1a2236; }
  .brand-sub { font-size: 9px; letter-spacing: 3px; color: #666; }
  .flag { display: flex; gap: 2px; margin-top: 4px; }
  .flag-stripe { height: 3px; width: 20px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 1px; }
  .badge-bozza     { background: #f1f5f9; color: #64748b; }
  .badge-esecutiva { background: #dcfce7; color: #15803d; }
  .tipo-badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; }
  .tipo-tecnico { background: #dbeafe; color: #1d4ed8; }
  .tipo-interno { background: #fef3c7; color: #92400e; }
  h2 { font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #1a2236; }
  .meta { display: flex; gap: 20px; margin: 8px 0; }
  .meta-item { }
  .meta-label { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-value { font-size: 11px; font-weight: 600; color: #333; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 6px; }
  .field-label { color: #999; font-size: 9px; }
  .field-value { font-weight: 600; color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f4f6f9; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .totale-row { background: #f4f6f9; font-weight: 700; }
  .logo-item { background: #f9fafb; padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; }
  .warning-box { background: #fef9c3; border: 1px solid #fde047; border-radius: 4px; padding: 6px 10px; font-size: 10px; color: #854d0e; margin-bottom: 12px; }
  .cost-table { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; }
  .cost-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .cost-total { font-weight: 700; border-top: 1px solid #fde68a; padding-top: 4px; margin-top: 4px; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #999; font-size: 9px; }
  .img-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  .img-grid img { max-height: 220px; max-width: 220px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">DOUBLE U</div>
      <div class="brand-sub">HANDCRAFTED IN ITALY</div>
      <div class="flag">
        <div class="flag-stripe" style="background:#009246"></div>
        <div class="flag-stripe" style="background:#fff; border:1px solid #eee"></div>
        <div class="flag-stripe" style="background:#ce2b37"></div>
      </div>
    </div>
    <div style="text-align:right">
      <span class="tipo-badge ${isInterno ? "tipo-interno" : "tipo-tecnico"}">
        ${isInterno ? "DOCUMENTO INTERNO RISERVATO" : "SCHEDA TECNICA"}
      </span>
      <div style="margin-top: 6px; color: #999; font-size: 9px;">
        Data stampa: ${new Date().toLocaleDateString("it-IT")}
      </div>
    </div>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Scheda produzione</div>
    <div style="display: flex; align-items: center; gap: 10px; margin: 4px 0;">
      <h2>${scheda.nomeArticolo.toUpperCase()}</h2>
      <span class="badge badge-${scheda.stato === "esecutiva" ? "esecutiva" : "bozza"}">${scheda.stato === "esecutiva" ? "ESECUTIVA" : "BOZZA"}</span>
    </div>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Codice scheda</div><div class="meta-value">${scheda.codice}</div></div>
      <div class="meta-item"><div class="meta-label">Cliente / Club</div><div class="meta-value">${scheda.cliente?.nome || "—"}</div></div>
      <div class="meta-item"><div class="meta-label">Collezione</div><div class="meta-value">${scheda.collezione || "—"}</div></div>
      <div class="meta-item"><div class="meta-label">Data creazione</div><div class="meta-value">${new Date(scheda.createdAt).toLocaleDateString("it-IT")}</div></div>
      <div class="meta-item"><div class="meta-label">Versione</div><div class="meta-value">${scheda.versione}</div></div>
    </div>
  </div>

  ${immagini.length > 0 ? `
  <div class="section">
    <div class="section-title">Immagini prodotto</div>
    <div class="img-grid">
      ${immagini.map((url) => `<img src="${url}" alt="Prodotto" />`).join("")}
    </div>
  </div>
  ` : ""}

  <div class="grid2">
    <div class="section">
      <div class="section-title">Informazioni articolo</div>
      <div class="grid2">
        <div class="field"><div class="field-label">Categoria</div><div class="field-value">${scheda.categoria || "—"}</div></div>
        <div class="field"><div class="field-label">Vestibilità</div><div class="field-value">${scheda.vestibilita || "—"}</div></div>
        <div class="field"><div class="field-label">Genere</div><div class="field-value">${scheda.genere || "—"}</div></div>
        <div class="field"><div class="field-label">Stagione</div><div class="field-value">${scheda.stagione || "—"}</div></div>
        <div class="field"><div class="field-label">Utilizzo</div><div class="field-value">${scheda.utilizzo || "—"}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Specifiche prodotto</div>
      <div class="grid2">
        <div class="field"><div class="field-label">Tessuto principale</div><div class="field-value">${scheda.tessutoPrincipale || "—"}</div></div>
        <div class="field"><div class="field-label">Peso tessuto</div><div class="field-value">${scheda.pesoTessuto || "—"}</div></div>
        ${scheda.altezzaTessuto ? `<div class="field"><div class="field-label">Altezza tessuto</div><div class="field-value">${scheda.altezzaTessuto}</div></div>` : ""}
        ${(scheda as { tessutoSecondario?: string | null }).tessutoSecondario ? `<div class="field"><div class="field-label">Costina</div><div class="field-value">${(scheda as { tessutoSecondario?: string | null }).tessutoSecondario}</div></div>` : ""}
        ${(scheda as { pesoTessutoSecondario?: string | null }).pesoTessutoSecondario ? `<div class="field"><div class="field-label">Peso costina</div><div class="field-value">${(scheda as { pesoTessutoSecondario?: string | null }).pesoTessutoSecondario}</div></div>` : ""}
        <div class="field"><div class="field-label">Colore base</div><div class="field-value">${scheda.coloreBase || "—"}</div></div>
        <div class="field"><div class="field-label">Colori secondari</div><div class="field-value">${scheda.coloriSecondari || "—"}</div></div>
        ${scheda.collo ? `<div class="field"><div class="field-label">Collo</div><div class="field-value">${scheda.collo}</div></div>` : ""}
        ${scheda.maniche ? `<div class="field"><div class="field-label">Maniche</div><div class="field-value">${scheda.maniche}</div></div>` : ""}
      </div>
      ${scheda.noteSpecifiche ? `<div class="field" style="margin-top:6px"><div class="field-label">Note</div><div class="field-value">${scheda.noteSpecifiche}</div></div>` : ""}
    </div>
  </div>

  ${scheda.loghi.length > 0 ? `
  <div class="section">
    <div class="section-title">Loghi e personalizzazione</div>
    <div class="grid3">
      ${scheda.loghi.map((l) => `
        <div class="logo-item">
          <div style="font-weight:600">${l.logo.nome}</div>
          <div class="field-label">Tecnica: ${l.tecnica} · Posizione: ${l.posizione}${l.dimensione ? " · " + l.dimensione : ""}</div>
          ${l.note ? `<div style="color:#666">${l.note}</div>` : ""}
        </div>
      `).join("")}
    </div>
    ${scheda.colorePrincipale ? `<div class="field" style="margin-top:6px"><div class="field-label">Colore principale</div><div class="field-value">${scheda.colorePrincipale}</div></div>` : ""}
    ${scheda.coloreSecondario ? `<div class="field"><div class="field-label">Colori secondari</div><div class="field-value">${renderColoreSecondarioPdf(scheda.coloreSecondario)}</div></div>` : ""}
    ${scheda.notePersonalizzazione ? `<div class="field"><div class="field-label">Note personalizzazione</div><div class="field-value">${scheda.notePersonalizzazione}</div></div>` : ""}
  </div>
  ` : ""}

  <div class="grid2">
    ${taglie.length > 0 ? `
    <div class="section">
      ${isElastico ? `
        <div class="section-title">Specifiche Elastico Vita</div>
        ${specsElastico?.altezza ? `<div class="field"><div class="field-label">Altezza elastico</div><div class="field-value">${specsElastico.altezza} cm</div></div>` : ""}
        ${specsElastico?.tipo ? `<div class="field"><div class="field-label">Tipo</div><div class="field-value">${specsElastico.tipo}</div></div>` : ""}
        ${specsElastico?.costruzione ? `<div class="field"><div class="field-label">Costruzione</div><div class="field-value">${specsElastico.costruzione}</div></div>` : ""}
        ${specsElastico?.applicazione ? `<div class="field"><div class="field-label">Applicazione</div><div class="field-value">${specsElastico.applicazione}</div></div>` : ""}
        <div style="margin-top:10px"><div class="section-title">Lunghezza Elastico per Taglia</div></div>
        <table>
          <tr>
            <th>Taglia</th>
            <th>Lunghezza Elastico (cm)</th>
            <th>Altezza (cm)</th>
          </tr>
          ${taglie.map((t) => `
            <tr>
              <td><strong>${t}</strong></td>
              <td>${(tabellaMisure[t] as { lunghezzaElastico?: number })?.lunghezzaElastico || "—"}</td>
              <td>${(tabellaMisure[t] as { altezzaElastico?: number })?.altezzaElastico || "—"}</td>
            </tr>
          `).join("")}
        </table>
      ` : `
        <div class="section-title">Tabella misure (cm)</div>
        <table>
          <tr>
            <th>Taglia</th>
            <th>Torace</th>
            <th>Lunghezza</th>
            <th>Spalla</th>
            <th>Lung. manica</th>
          </tr>
          ${taglie.map((t) => `
            <tr>
              <td><strong>${t}</strong></td>
              <td>${(tabellaMisure[t] as { torace?: number })?.torace || "—"}</td>
              <td>${(tabellaMisure[t] as { lunghezza?: number })?.lunghezza || "—"}</td>
              <td>${(tabellaMisure[t] as { spalla?: number })?.spalla || "—"}</td>
              <td>${(tabellaMisure[t] as { lungManica?: number })?.lungManica || "—"}</td>
            </tr>
          `).join("")}
        </table>
      `}
    </div>
    ` : ""}

    ${taglie.length > 0 ? `
    <div class="section">
      <div class="section-title">Quantità per taglia — totale: ${totalePezzi} pz</div>
      <table style="border-collapse:collapse;">
        <tr>
          ${taglie.map((t) => `<th style="text-align:center;padding:5px 10px;background:#f4f6f9;font-size:10px;border:1px solid #e5e7eb;">${t}</th>`).join("")}
          <th style="text-align:center;padding:5px 10px;background:#1a2236;color:white;font-size:10px;border:1px solid #1a2236;">TOT</th>
        </tr>
        <tr>
          ${taglie.map((t) => `<td style="text-align:center;padding:6px 10px;font-weight:700;font-size:12px;border:1px solid #e5e7eb;">${quantitaTaglia[t] || 0}</td>`).join("")}
          <td style="text-align:center;padding:6px 10px;font-weight:800;font-size:12px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;">${totalePezzi}</td>
        </tr>
      </table>
    </div>
    ` : ""}
  </div>

  ${scheda.noteProduzione || scheda.tolleranzaTaglio ? `
  <div class="section">
    <div class="section-title">Note di produzione e tolleranze</div>
    <div class="grid2">
      <div>
        ${scheda.noteProduzione ? `<div class="field"><div class="field-label">Note generali</div><div class="field-value">${scheda.noteProduzione}</div></div>` : ""}
        ${scheda.tolleranzaTaglio ? `<div class="field"><div class="field-label">Taglio</div><div class="field-value">${scheda.tolleranzaTaglio}</div></div>` : ""}
        ${scheda.tolleranzaCucitura ? `<div class="field"><div class="field-label">Cucitura</div><div class="field-value">${scheda.tolleranzaCucitura}</div></div>` : ""}
        ${scheda.controlloQualita ? `<div class="field"><div class="field-label">Controllo qualità</div><div class="field-value">${scheda.controlloQualita}</div></div>` : ""}
      </div>
      <div>
        ${scheda.tolleranzaColore ? `<div class="field"><div class="field-label">Colore</div><div class="field-value">${scheda.tolleranzaColore}</div></div>` : ""}
        ${scheda.tolleranzaStampa ? `<div class="field"><div class="field-label">Stampa / Ricamo</div><div class="field-value">${scheda.tolleranzaStampa}</div></div>` : ""}
        ${scheda.packaging ? `<div class="field"><div class="field-label">Packaging</div><div class="field-value">${scheda.packaging}</div></div>` : ""}
      </div>
    </div>
  </div>
  ` : ""}

  ${isInterno && (consumi.length > 0 || scheda.costoLavorazione) ? `
  <div class="section">
    <div class="warning-box">⚠️ DOCUMENTO RISERVATO – Questa sezione contiene informazioni economiche riservate. NON distribuire a produttori, modellisti o sala taglio.</div>
    <div class="section-title">Costi interni (solo uso interno)</div>
    <div class="cost-table">
      ${consumi.length > 0 ? `
      <div style="margin-bottom: 8px;">
        <div style="font-size: 9px; color: #92400e; margin-bottom: 4px; font-weight: 700;">CONSUMO MATERIALE</div>
        ${consumi.map((c: ConsumoMateriale) => `
          <div class="cost-row">
            <span>${c.nomeM}</span>
            <span>${c.consumoPerCapo} ${c.unita}/capo${c.costoUnitario ? ` × €${c.costoUnitario} = €${(c.consumoPerCapo * c.costoUnitario).toFixed(2)}/capo` : ""}</span>
          </div>
        `).join("")}
      </div>
      ` : ""}
      <div class="cost-row"><span>Costo materiali/capo</span><span>€ ${costoMaterialePerCapo.toFixed(2)}</span></div>
      <div class="cost-row"><span>Costo lavorazione/capo</span><span>€ ${(scheda.costoLavorazione || 0).toFixed(2)}</span></div>
      <div class="cost-row cost-total"><span>COSTO TOTALE/CAPO</span><span>€ ${costoTotalePerCapo.toFixed(2)}</span></div>
      ${totalePezzi > 0 ? `<div class="cost-row"><span>Costo totale ordine (${totalePezzi} pz)</span><span>€ ${(costoTotalePerCapo * totalePezzi).toFixed(2)}</span></div>` : ""}
      ${scheda.prezzoVendita ? `
        <div class="cost-row"><span>Prezzo vendita/capo</span><span>€ ${scheda.prezzoVendita.toFixed(2)}</span></div>
        <div class="cost-row" style="color: ${scheda.prezzoVendita > costoTotalePerCapo ? "#15803d" : "#dc2626"}; font-weight: 700;">
          <span>Margine</span>
          <span>${((scheda.prezzoVendita - costoTotalePerCapo) / scheda.prezzoVendita * 100).toFixed(1)}%</span>
        </div>
      ` : ""}
    </div>
  </div>
  ` : ""}

  <div class="footer">
    <span>Double U – Handcrafted in Italy · Scheda ${isInterno ? "Interna" : "Tecnica"} · ${scheda.codice} · v${scheda.versione}</span>
    <span>Stampato il ${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
