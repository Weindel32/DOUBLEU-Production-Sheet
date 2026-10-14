// Barra in cima alle versioni per stampa (HTML da stampare): Indietro, Home, Stampa / Invia.
// Su iPhone la stampa si apre nella stessa finestra dell'app: senza questa barra non si torna indietro.
// Non esce in stampa (@media print).

/** Solo percorsi interni ("/m/schede/…"): niente redirect verso altri siti dal parametro ?torna. */
export function percorsoInterno(v: string | null | undefined, ripiego: string) {
  return v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : ripiego;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * `da=m` (versione iPhone) → Home è /m; altrimenti la dashboard. `torna` = dove riporta "Indietro".
 * Leggili dalla richiesta: /api/...?...&da=m&torna=/m/schede/xyz
 */
export function barraStampa(params: URLSearchParams) {
  const mobile = params.get("da") === "m";
  const home = mobile ? "/m" : "/dashboard";
  const indietro = percorsoInterno(params.get("torna"), home);
  const css = `
  .barra-stampa { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 8px; margin: -24px -24px 18px; padding: calc(10px + env(safe-area-inset-top)) 16px 10px; background: #0E1B2C; font-family: Arial, sans-serif; }
  .barra-stampa a, .barra-stampa button { height: 42px; padding: 0 14px; border-radius: 10px; font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; border: 1px solid rgba(255,255,255,.35); color: #fff; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .barra-stampa .stampa { margin-left: auto; background: #fff; color: #0E1B2C; border-color: #fff; }
  .barra-aiuto { margin: 0 0 16px; font-size: 12px; color: #5F6878; font-family: Arial, sans-serif; }
  @media print { .barra-stampa, .barra-aiuto { display: none !important; } }`;
  const html = `
<div class="barra-stampa">
  <a href="${esc(indietro)}">&#8249; Indietro</a>
  <a href="${home}">Home</a>
  <button type="button" class="stampa" onclick="window.print()">Stampa / Invia</button>
</div>
${mobile ? '<p class="barra-aiuto">Se Stampa / Invia non apre la stampa (app sulla schermata Home): tocca l\'icona Condividi in basso, poi Stampa; per inviarlo come PDF, in Condividi scegli Opzioni → PDF.</p>' : ""}`;
  return { css, html };
}

/** Pagina di cortesia quando non c'è niente da stampare: con la barra, per non restare bloccati su iPhone. */
export function paginaVuota(params: URLSearchParams, messaggio: string) {
  const barra = barraStampa(params);
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Niente da stampare</title><style>body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; margin: 0; } p.msg { font-size: 16px; margin-top: 24px; }${barra.css}</style></head>
<body>${barra.html.replace(/<p class="barra-aiuto">.*<\/p>/, "")}<p class="msg">${esc(messaggio)}</p></body></html>`;
}
