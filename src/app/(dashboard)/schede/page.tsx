export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, FileText } from "lucide-react";
import { formatData, STATI_SCHEDA, calcolaTotaleQuantita } from "@/lib/utils";
import SchedaRowMenu from "@/components/scheda/SchedaRowMenu";

export default async function SchedePage() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true },
  });

  const totale = schede.length;
  const esecutive = schede.filter((s) => s.stato === "esecutiva").length;
  const bozze = schede.filter((s) => s.stato === "bozza").length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Schede produzione</h1>
          <p className="text-sm text-[#8ba3c7] mt-0.5">Tutte le schede tecniche degli articoli</p>
        </div>
        <Link
          href="/schede/nuova"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Nuova scheda
        </Link>
      </div>

      {/* Counter pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-white">{totale}</div>
          <div className="text-[10px] text-[#8ba3c7] uppercase tracking-wider mt-0.5">Totali</div>
        </div>
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{esecutive}</div>
          <div className="text-[10px] text-[#8ba3c7] uppercase tracking-wider mt-0.5">Esecutive</div>
        </div>
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-[#8ba3c7]">{bozze}</div>
          <div className="text-[10px] text-[#8ba3c7] uppercase tracking-wider mt-0.5">Bozze</div>
        </div>
      </div>

      {/* Lista */}
      {schede.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="mx-auto mb-4 text-[#4e6585]" />
          <h2 className="text-[#8ba3c7] font-medium mb-2">Nessuna scheda</h2>
          <p className="text-[#4e6585] text-sm mb-4">Crea la prima scheda di produzione</p>
          <Link
            href="/schede/nuova"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <PlusCircle size={16} />
            Nuova scheda
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/7">
                <th className="text-left px-4 py-3">Articolo</th>
                <th className="text-left px-4 py-3">Codice</th>
                <th className="text-left px-4 py-3">Cliente / Club</th>
                <th className="text-left px-4 py-3">Collezione</th>
                <th className="text-left px-4 py-3">Stato</th>
                <th className="text-left px-4 py-3">Quantità</th>
                <th className="text-left px-4 py-3">Ultima modifica</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schede.map((s) => {
                const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
                const quantita = s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {};
                const totPz = calcolaTotaleQuantita(quantita as Record<string, number>);
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/schede/${s.id}`} className="font-medium text-white hover:text-blue-300 transition-colors">
                        {s.nomeArticolo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] font-mono text-xs">{s.codice}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{s.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{s.collezione || "—"}</td>
                    <td className="px-4 py-3">
                      {stato && <span className={`badge badge-${s.stato}`}>{stato.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7] font-medium">{totPz > 0 ? `${totPz} pz` : "—"}</td>
                    <td className="px-4 py-3 text-[#4e6585] text-xs">{formatData(s.updatedAt)}</td>
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
