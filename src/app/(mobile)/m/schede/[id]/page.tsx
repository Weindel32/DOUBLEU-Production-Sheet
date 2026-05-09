export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatData, calcolaTotaleQuantita, TAGLIE_ADULTO, TAGLIE_KIDS, CATEGORIE_ELASTICO } from "@/lib/utils";

const STATO_STYLE: Record<string, string> = {
  bozza:     "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  esecutiva: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
};

const STATO_LABEL: Record<string, string> = {
  bozza:     "Bozza",
  esecutiva: "Esecutiva",
};

const cardStyle = { backgroundColor: "#112240", border: "1px solid rgba(255,255,255,0.07)" };
const headerStyle = { backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" };

export default async function MobileSchedaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await prisma.scheda.findUnique({
    where: { id },
    include: { cliente: true },
  });

  if (!scheda) notFound();

  const quantita: Record<string, number> = scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {};
  const tabellaMisure = scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {};
  const totale = calcolaTotaleQuantita(quantita);
  const immagini: string[] = scheda.immagini ? JSON.parse(scheda.immagini) : [];
  const tutteLeTaglie = [...TAGLIE_ADULTO, ...TAGLIE_KIDS];
  const taglieAttive = tutteLeTaglie.filter((t) => quantita[t] || tabellaMisure[t]);

  return (
    <div className="flex flex-col min-h-screen pb-8">

      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "#0a1628", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/m/schede" className="text-sm mb-3 block" style={{ color: "#8ba3c7" }}>
          ← Tutte le schede
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "#4e6585" }}>
              SCHEDA PRODUZIONE · {scheda.codice}
            </div>
            <h1 className="text-lg font-bold text-white leading-tight">{scheda.nomeArticolo}</h1>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATO_STYLE[scheda.stato] ?? ""}`}>
            {STATO_LABEL[scheda.stato] ?? scheda.stato}
          </span>
        </div>
      </div>

      {/* ── Pulsante PDF — azione primaria ── */}
      <div className="px-4 pt-4 pb-2 flex gap-3">
        <a
          href={`/api/schede/${scheda.id}/pdf?tipo=tecnico`}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-2 text-white font-semibold text-sm py-3 rounded-xl"
          style={{ backgroundColor: "#2563eb" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PDF Tecnico
        </a>
        <a
          href={`/api/schede/${scheda.id}/pdf?tipo=interno`}
          target="_blank"
          className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl"
          style={{ backgroundColor: "#112240", border: "1px solid rgba(255,255,255,0.12)", color: "#8ba3c7" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PDF Interno
        </a>
      </div>

      <div className="px-4 py-2 space-y-4">

        {/* Immagini */}
        {immagini.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {immagini.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Immagine ${i + 1}`}
                className="h-40 w-40 object-contain rounded-xl flex-shrink-0"
                style={{ backgroundColor: "#1a3060", border: "1px solid rgba(255,255,255,0.07)" }}
              />
            ))}
          </div>
        )}

        {/* Info principali */}
        <div className="rounded-xl overflow-hidden" style={cardStyle}>
          <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ ...headerStyle, color: "#8ba3c7" }}>
            Articolo
          </div>
          <div>
            {[
              { label: "Cliente",      value: scheda.cliente?.nome },
              { label: "Collezione",   value: scheda.collezione },
              { label: "Categoria",    value: scheda.categoria },
              { label: "Genere",       value: scheda.genere },
              { label: "Vestibilità",  value: scheda.vestibilita },
              { label: "Stagione",     value: scheda.stagione },
              { label: "Tessuto",      value: scheda.tessutoPrincipale },
              { label: "Colore base",  value: scheda.coloreBase },
              { label: "Col. secondari", value: scheda.coloriSecondari },
              { label: "Maniche",      value: scheda.maniche },
              { label: "Collo",        value: scheda.collo },
            ].filter((r) => r.value).map(({ label, value }, i, arr) => (
              <div
                key={label}
                className="flex items-center px-4 py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <span className="text-xs w-28 flex-shrink-0" style={{ color: "#4e6585" }}>{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quantità per taglia */}
        {taglieAttive.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={headerStyle}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8ba3c7" }}>Quantità per taglia</span>
              {totale > 0 && <span className="text-xs font-bold text-blue-300">Totale: {totale} pz</span>}
            </div>
            <div className="px-4 py-3 overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr>
                    {taglieAttive.map((t) => (
                      <th key={t} className="text-center px-2 py-1 text-xs font-medium min-w-[40px]" style={{ color: "#4e6585" }}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {taglieAttive.map((t) => (
                      <td key={t} className="text-center px-2 py-1 font-semibold text-sm text-white">
                        {quantita[t] || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabella misure */}
        {taglieAttive.length > 0 && Object.keys(tabellaMisure).length > 0 && (() => {
          const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
          const specs = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;
          return (
            <div className="rounded-xl overflow-hidden" style={cardStyle}>
              <div className="px-4 py-2.5" style={headerStyle}>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8ba3c7" }}>
                  {isElastico ? "Elastico Vita" : "Misure (cm)"}
                </span>
              </div>
              {isElastico && (specs?.tipo || specs?.costruzione || specs?.applicazione) && (
                <div className="px-4 py-3 space-y-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {specs?.altezza && <p className="text-xs" style={{ color: "#8ba3c7" }}>Altezza elastico: <strong className="text-white">{specs.altezza} cm</strong></p>}
                  {specs?.tipo && <p className="text-xs" style={{ color: "#8ba3c7" }}>Tipo: {specs.tipo}</p>}
                  {specs?.costruzione && <p className="text-xs" style={{ color: "#8ba3c7" }}>Costruzione: {specs.costruzione}</p>}
                  {specs?.applicazione && <p className="text-xs" style={{ color: "#8ba3c7" }}>Applicazione: {specs.applicazione}</p>}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#4e6585" }}>Taglia</th>
                      {isElastico
                        ? [["Lung. Elastico"], ["Altezza"]].map(([h]) => (
                            <th key={h} className="text-right px-2 py-2 font-medium" style={{ color: "#4e6585" }}>{h}</th>
                          ))
                        : ["Torace", "Lung.", "Spalla", "Manica"].map((h) => (
                            <th key={h} className="text-right px-2 py-2 font-medium" style={{ color: "#4e6585" }}>{h}</th>
                          ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {taglieAttive.filter((t) => tabellaMisure[t]).map((t, i, arr) => (
                      <tr key={t} style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td className="px-3 py-2 font-semibold text-white">{t}</td>
                        {isElastico ? (
                          <>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { lunghezzaElastico?: number })?.lunghezzaElastico ?? "—"}</td>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { altezzaElastico?: number })?.altezzaElastico ?? "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { torace?: number })?.torace ?? "—"}</td>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { lunghezza?: number })?.lunghezza ?? "—"}</td>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { spalla?: number })?.spalla ?? "—"}</td>
                            <td className="px-2 py-2 text-right" style={{ color: "#8ba3c7" }}>{(tabellaMisure[t] as { lungManica?: number })?.lungManica ?? "—"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Fornitori */}
        {(scheda.modellista || scheda.fornitoreTessuto || scheda.produttore) && (
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ ...headerStyle, color: "#8ba3c7" }}>
              Fornitori
            </div>
            <div>
              {[
                { label: "Modellista",       value: scheda.modellista },
                { label: "Fornitore tessuto", value: scheda.fornitoreTessuto },
                { label: "Produttore",       value: scheda.produttore },
              ].filter((r) => r.value).map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className="flex items-center px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <span className="text-xs w-32 flex-shrink-0" style={{ color: "#4e6585" }}>{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note produzione */}
        {scheda.noteProduzione && (
          <div className="rounded-xl p-4" style={cardStyle}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#8ba3c7" }}>Note di produzione</div>
            <p className="text-sm leading-relaxed" style={{ color: "#e8edf4" }}>{scheda.noteProduzione}</p>
          </div>
        )}

        {/* Meta */}
        <div className="text-center text-xs pt-2 pb-4" style={{ color: "#4e6585" }}>
          v{scheda.versione} · {formatData(scheda.createdAt.toISOString())}
        </div>
      </div>
    </div>
  );
}
