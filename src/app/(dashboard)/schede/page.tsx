export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, FileText } from "lucide-react";
import { formatData, STATI_SCHEDA } from "@/lib/utils";
import SchedaRowMenu from "@/components/scheda/SchedaRowMenu";

export default async function SchedePage() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true },
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schede produzione</h1>
          <p className="text-sm text-gray-500 mt-0.5">{schede.length} schede totali</p>
        </div>
        <Link
          href="/schede/nuova"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Nuova scheda
        </Link>
      </div>

      {/* Filtri stato */}
      <div className="flex gap-2 flex-wrap">
        <span className="badge bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200">Tutte</span>
        {STATI_SCHEDA.map((s) => (
          <span key={s.value} className={`badge badge-${s.value} cursor-pointer`}>{s.label}</span>
        ))}
      </div>

      {/* Lista */}
      {schede.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-gray-600 font-medium mb-2">Nessuna scheda</h2>
          <p className="text-gray-400 text-sm mb-4">Crea la prima scheda di produzione</p>
          <Link
            href="/schede/nuova"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <PlusCircle size={16} />
            Nuova scheda
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Articolo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Codice</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Cliente / Club</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Collezione</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Stato</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Versione</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ultima modifica</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schede.map((s) => {
                const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/schede/${s.id}`} className="font-medium text-gray-800 hover:text-blue-700">
                        {s.nomeArticolo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.codice}</td>
                    <td className="px-4 py-3 text-gray-600">{s.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.collezione || "—"}</td>
                    <td className="px-4 py-3">
                      {stato && <span className={`badge badge-${s.stato}`}>{stato.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.versione}</td>
                    <td className="px-4 py-3 text-gray-400">{formatData(s.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <SchedaRowMenu id={s.id} nome={s.nomeArticolo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
