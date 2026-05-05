export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatData, calcolaTotaleQuantita, TAGLIE_ADULTO, TAGLIE_KIDS } from "@/lib/utils";

const STATO_BADGE: Record<string, string> = {
  bozza: "bg-gray-100 text-gray-600",
  revisione: "bg-yellow-100 text-yellow-700",
  approvata: "bg-blue-100 text-blue-700",
  produzione: "bg-purple-100 text-purple-700",
  consegnata: "bg-green-100 text-green-700",
};

const STATO_LABEL: Record<string, string> = {
  bozza: "Bozza",
  revisione: "Revisione",
  approvata: "Approvata",
  produzione: "In produzione",
  consegnata: "Consegnata",
};

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
    <div className="flex flex-col min-h-screen pb-6">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 pt-12 pb-4">
        <Link href="/m/schede" className="text-sm opacity-80 mb-3 block">← Tutte le schede</Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold leading-tight">{scheda.nomeArticolo}</h1>
            <div className="text-sm opacity-70 mt-0.5">{scheda.codice}</div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATO_BADGE[scheda.stato]}`}>
            {STATO_LABEL[scheda.stato]}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Immagini */}
        {immagini.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {immagini.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Immagine ${i + 1}`}
                className="h-40 w-40 object-contain rounded-xl bg-white border border-gray-100 flex-shrink-0"
              />
            ))}
          </div>
        )}

        {/* Info principali */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Articolo</div>
          <div className="divide-y divide-gray-50">
            {[
              { label: "Cliente", value: scheda.cliente?.nome },
              { label: "Collezione", value: scheda.collezione },
              { label: "Categoria", value: scheda.categoria },
              { label: "Genere", value: scheda.genere },
              { label: "Vestibilità", value: scheda.vestibilita },
              { label: "Stagione", value: scheda.stagione },
              { label: "Tessuto", value: scheda.tessutoPrincipale },
              { label: "Colore base", value: scheda.coloreBase },
              { label: "Maniche", value: scheda.maniche },
              { label: "Collo", value: scheda.collo },
            ].filter((r) => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-center px-4 py-2.5">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quantità per taglia */}
        {taglieAttive.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantità per taglia</span>
              {totale > 0 && <span className="text-xs font-bold text-blue-700">Totale: {totale} pz</span>}
            </div>
            <div className="px-4 py-3 overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr>
                    {taglieAttive.map((t) => (
                      <th key={t} className="text-center px-2 py-1 text-xs text-gray-400 font-medium min-w-[40px]">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {taglieAttive.map((t) => (
                      <td key={t} className="text-center px-2 py-1 font-semibold text-gray-700 text-sm">
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
          const isElastico = ["Pantaloncino", "Short", "Skirt"].includes(scheda.categoria || "");
          const specs = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;
          return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {isElastico ? "Elastico Vita" : "Misure (cm)"}
                </span>
              </div>
              {isElastico && (specs?.tipo || specs?.costruzione || specs?.applicazione) && (
                <div className="px-4 py-3 border-b border-gray-50 space-y-1">
                  {specs?.altezza && <p className="text-xs text-gray-600">- Altezza elastico: <strong>{specs.altezza} cm</strong></p>}
                  {specs?.tipo && <p className="text-xs text-gray-600">- Tipo: {specs.tipo}</p>}
                  {specs?.costruzione && <p className="text-xs text-gray-600">- Costruzione: {specs.costruzione}</p>}
                  {specs?.applicazione && <p className="text-xs text-gray-600">- Applicazione: {specs.applicazione}</p>}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 text-gray-400 font-medium">Taglia</th>
                      {isElastico
                        ? [["Lung. Elastico", "lunghezzaElastico"], ["Altezza", "altezzaElastico"]].map(([h]) => (
                            <th key={h} className="text-right px-2 py-2 text-gray-400 font-medium">{h}</th>
                          ))
                        : ["Torace", "Lung.", "Spalla", "Manica"].map((h) => (
                            <th key={h} className="text-right px-2 py-2 text-gray-400 font-medium">{h}</th>
                          ))
                      }
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {taglieAttive.filter((t) => tabellaMisure[t]).map((t) => (
                      <tr key={t}>
                        <td className="px-3 py-2 font-semibold text-gray-700">{t}</td>
                        {isElastico ? (
                          <>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { lunghezzaElastico?: number })?.lunghezzaElastico ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { altezzaElastico?: number })?.altezzaElastico ?? "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { torace?: number })?.torace ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { lunghezza?: number })?.lunghezza ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { spalla?: number })?.spalla ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-600">{(tabellaMisure[t] as { lungManica?: number })?.lungManica ?? "—"}</td>
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fornitori</div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Modellista", value: scheda.modellista },
                { label: "Fornitore tessuto", value: scheda.fornitoreTessuto },
                { label: "Produttore", value: scheda.produttore },
              ].filter((r) => r.value).map(({ label, value }) => (
                <div key={label} className="flex items-center px-4 py-2.5">
                  <span className="text-xs text-gray-400 w-32 flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note produzione */}
        {scheda.noteProduzione && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Note di produzione</div>
            <p className="text-sm text-gray-700 leading-relaxed">{scheda.noteProduzione}</p>
          </div>
        )}

        {/* Meta */}
        <div className="text-center text-xs text-gray-400 pt-2">
          Creato {formatData(scheda.createdAt.toISOString())} · Versione {scheda.versione}
        </div>
      </div>
    </div>
  );
}
