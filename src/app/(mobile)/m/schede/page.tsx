export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatData, calcolaTotaleQuantita } from "@/lib/utils";

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

export default async function MobileSchedePage() {
  const schede = await prisma.scheda.findMany({
    where: { stato: { in: ["produzione", "approvata", "revisione"] } },
    include: { cliente: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">Double U</div>
        <h1 className="text-xl font-bold">Schede attive</h1>
        <div className="text-sm opacity-70 mt-0.5">{schede.length} schede</div>
      </div>

      {/* Filtro stati */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
        {["produzione", "approvata", "revisione"].map((s) => (
          <span key={s} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATO_BADGE[s]}`}>
            {STATO_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Lista schede */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {schede.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">Nessuna scheda attiva</div>
          </div>
        ) : (
          schede.map((s) => {
            const quantita = s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {};
            const totale = calcolaTotaleQuantita(quantita as Record<string, number>);
            return (
              <Link
                key={s.id}
                href={`/m/schede/${s.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{s.nomeArticolo}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.codice}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATO_BADGE[s.stato]}`}>
                    {STATO_LABEL[s.stato]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {s.cliente && <span>👤 {s.cliente.nome}</span>}
                  {totale > 0 && <span>📦 {totale} pz</span>}
                  <span className="ml-auto">{formatData(s.updatedAt.toISOString())}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 text-center">
        <div className="text-xs text-gray-400">Double U Production Sheet</div>
        <a href="/" className="text-xs text-blue-600 mt-0.5 block">Apri versione desktop →</a>
      </div>
    </div>
  );
}
