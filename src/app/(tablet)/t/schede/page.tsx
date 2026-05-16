export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, FileText } from "lucide-react";
import { formatData, STATI_SCHEDA, calcolaTotaleQuantita } from "@/lib/utils";

export default async function TabletSchedePage() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true },
  });

  const totale = schede.length;
  const esecutive = schede.filter((s) => s.stato === "esecutiva").length;
  const bozze = schede.filter((s) => s.stato === "bozza").length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Schede produzione</h1>
          <p className="text-xs text-[#8ba3c7] mt-0.5">Tutte le schede tecniche degli articoli</p>
        </div>
        <Link
          href="/t/schede/nuova"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Nuova
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

      {/* Cards list */}
      {schede.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="mx-auto mb-4 text-[#4e6585]" />
          <h2 className="text-[#8ba3c7] font-medium mb-2">Nessuna scheda</h2>
          <p className="text-[#4e6585] text-sm mb-4">Crea la prima scheda di produzione</p>
          <Link
            href="/t/schede/nuova"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <PlusCircle size={16} />
            Nuova scheda
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {schede.map((s) => {
            const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
            const quantita = s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {};
            const totPz = calcolaTotaleQuantita(quantita as Record<string, number>);
            return (
              <div
                key={s.id}
                className="min-h-[72px] py-4 px-4 border-b border-white/7 last:border-b-0"
              >
                {/* Top row: badge + nome + codice */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {stato && (
                    <span className={`badge badge-${s.stato}`}>{stato.label}</span>
                  )}
                  <Link
                    href={`/t/schede/${s.id}`}
                    className="font-semibold text-white hover:text-blue-300 transition-colors flex-1 min-w-0 truncate"
                  >
                    {s.nomeArticolo}
                  </Link>
                  <span className="font-mono text-xs text-[#4e6585] flex-shrink-0">{s.codice}</span>
                </div>

                {/* Middle: cliente + collezione + quantita */}
                <div className="flex items-center gap-3 text-xs text-[#8ba3c7] flex-wrap mb-1">
                  {s.cliente && <span>{s.cliente.nome}</span>}
                  {s.cliente && s.collezione && <span className="text-[#4e6585]">·</span>}
                  {s.collezione && <span>{s.collezione}</span>}
                  {totPz > 0 && (
                    <>
                      <span className="text-[#4e6585]">·</span>
                      <span>{totPz} pz</span>
                    </>
                  )}
                </div>

                {/* Bottom: data */}
                <div className="text-[10px] text-[#4e6585]">{formatData(s.updatedAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
