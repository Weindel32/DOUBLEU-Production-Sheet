export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { formatData, calcolaTotaleQuantita, TAGLIE_ADULTO, TAGLIE_KIDS, CATEGORIE_ELASTICO, STATI_SCHEDA } from "@/lib/utils";
import Testata from "@/components/mobile/Testata";
import { etichettaColore } from "@/lib/colori";
import { riferimentoColori } from "@/lib/coloriServer";

function Blocco({ titolo, destra, children }: { titolo: string; destra?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#EFEBE2] flex items-baseline justify-between">
        <h2 className="font-display font-bold text-[16px]">{titolo}</h2>
        {destra}
      </div>
      {children}
    </section>
  );
}

function Righe({ righe }: { righe: { label: string; value: string | null | undefined }[] }) {
  return (
    <dl className="divide-y divide-[#EFEBE2]">
      {righe.filter((r) => r.value).map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-3 px-4 py-2.5">
          <dt className="text-[13px] text-[#5F6878] w-32 flex-shrink-0">{label}</dt>
          <dd className="text-[15px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Consultazione della scheda dal telefono (laboratorio, fornitore): sola lettura, niente costi. */
export default async function MobileSchedaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheda = await prisma.scheda.findUnique({ where: { id }, include: { cliente: true } });
  if (!scheda) notFound();
  const rif = await riferimentoColori(scheda.tessutoPrincipale);

  const quantita: Record<string, number> = scheda.quantitaTaglia ? JSON.parse(scheda.quantitaTaglia) : {};
  const tabellaMisure = scheda.tabellaMisure ? JSON.parse(scheda.tabellaMisure) : {};
  const totale = calcolaTotaleQuantita(quantita);
  const immagini: string[] = scheda.immagini ? JSON.parse(scheda.immagini) : [];
  const taglieAttive = [...TAGLIE_ADULTO, ...TAGLIE_KIDS].filter((t) => quantita[t] || tabellaMisure[t]);
  const stato = STATI_SCHEDA.find((s) => s.value === scheda.stato);
  const isElastico = CATEGORIE_ELASTICO.includes(scheda.categoria || "");
  const specs = tabellaMisure.__specs as { altezza?: string; tipo?: string; costruzione?: string; applicazione?: string } | undefined;
  const misura = (t: string, k: string) => (tabellaMisure[t] as Record<string, number | undefined> | undefined)?.[k] ?? "—";

  return (
    <>
      <Testata indietro="/m/schede" sopra={[scheda.codiceModello, scheda.codice].filter(Boolean).join(" · ")} titolo={scheda.nomeArticolo}
        destra={stato && <span className={`badge badge-${scheda.stato} flex-shrink-0 mb-2`}>{stato.label}</span>} />

      <div className="px-4 space-y-3 pb-6">
        {immagini.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
            {immagini.map((img, i) => (
              <a key={i} href={img} target="_blank" rel="noreferrer" className="snap-start flex-shrink-0">
                <img src={img} alt={`Immagine ${i + 1}`} className="h-48 w-48 object-contain rounded-2xl bg-white border border-[#E4E0D6]" />
              </a>
            ))}
          </div>
        )}

        <Blocco titolo="Articolo">
          <Righe righe={[
            { label: "Modello", value: scheda.codiceModello },
            { label: "Cliente", value: scheda.cliente?.nome },
            { label: "Collezione", value: scheda.collezione },
            { label: "Categoria", value: scheda.categoria },
            { label: "Genere", value: scheda.genere },
            { label: "Vestibilità", value: scheda.vestibilita },
            { label: "Tessuto", value: scheda.tessutoPrincipale },
            { label: "Peso", value: scheda.pesoTessuto },
            { label: "Colore base", value: etichettaColore(scheda.coloreBase, scheda.coloreBaseCodice, rif.fornitore, rif.nomeFornitore(scheda.coloreBaseCodice)) },
            { label: "Colori secondari", value: etichettaColore(scheda.coloriSecondari, scheda.coloriSecondariCodice, rif.fornitore, rif.nomeFornitore(scheda.coloriSecondariCodice)) },
            { label: "Collo", value: scheda.collo },
            { label: "Maniche", value: scheda.maniche },
          ]} />
        </Blocco>

        {taglieAttive.length > 0 && (
          <Blocco titolo="Quantità" destra={totale > 0 && <span className="font-mono font-semibold text-[#1F3A68]">{totale} pz</span>}>
            <div className="grid grid-cols-4 gap-2 p-3">
              {taglieAttive.map((t) => (
                <div key={t} className="rounded-xl bg-[#F6F4EF] py-2 text-center">
                  <div className="text-xs text-[#5F6878]">{t}</div>
                  <div className="font-mono font-semibold text-lg">{quantita[t] || 0}</div>
                </div>
              ))}
            </div>
          </Blocco>
        )}

        {taglieAttive.some((t) => tabellaMisure[t]) && (
          <Blocco titolo={isElastico ? "Elastico vita" : "Misure (cm)"}>
            {isElastico && (specs?.altezza || specs?.tipo || specs?.costruzione || specs?.applicazione) && (
              <Righe righe={[
                { label: "Altezza", value: specs?.altezza ? `${specs.altezza} cm` : null },
                { label: "Tipo", value: specs?.tipo },
                { label: "Costruzione", value: specs?.costruzione },
                { label: "Applicazione", value: specs?.applicazione },
              ]} />
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 text-xs">Taglia</th>
                    {(isElastico ? ["Lungh. elastico", "Altezza"] : ["Torace", "Lungh.", "Spalla", "Manica"]).map((h) => (
                      <th key={h} className="px-2 py-2 text-xs text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taglieAttive.filter((t) => tabellaMisure[t]).map((t) => (
                    <tr key={t}>
                      <td className="px-4 py-2 font-semibold">{t}</td>
                      {(isElastico ? ["lunghezzaElastico", "altezzaElastico"] : ["torace", "lunghezza", "spalla", "lungManica"]).map((k) => (
                        <td key={k} className="px-2 py-2 text-right font-mono">{misura(t, k)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Blocco>
        )}

        {(scheda.modellista || scheda.fornitoreTessuto || scheda.produttore) && (
          <Blocco titolo="Fornitori">
            <Righe righe={[
              { label: "Modellista", value: scheda.modellista },
              { label: "Fornitore tessuto", value: scheda.fornitoreTessuto },
              { label: "Produttore", value: scheda.produttore },
            ]} />
          </Blocco>
        )}

        {scheda.noteProduzione && (
          <Blocco titolo="Note per il produttore">
            <p className="px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line">{scheda.noteProduzione}</p>
          </Blocco>
        )}

        <p className="text-center text-xs text-[#5F6878] pt-1">
          Creata il {formatData(scheda.createdAt.toISOString())} · aggiornata il {formatData(scheda.updatedAt.toISOString())}
        </p>
      </div>
    </>
  );
}
