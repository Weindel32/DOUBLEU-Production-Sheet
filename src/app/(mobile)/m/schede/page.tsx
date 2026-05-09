export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatData, calcolaTotaleQuantita } from "@/lib/utils";

const STATO_STYLE: Record<string, string> = {
  bozza:     "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  esecutiva: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
};

const STATO_LABEL: Record<string, string> = {
  bozza:     "Bozza",
  esecutiva: "Esecutiva",
};

export default async function MobileSchedePage() {
  const schede = await prisma.scheda.findMany({
    orderBy: { updatedAt: "desc" },
    include: { cliente: true },
  });

  const esecutive = schede.filter((s) => s.stato === "esecutiva").length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-5 sticky top-0 z-10" style={{ backgroundColor: "#0a1628", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "#4e6585" }}>DOUBLEU</div>
        <h1 className="text-xl font-bold text-white">Schede produzione</h1>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: "#8ba3c7" }}>
          <span>{schede.length} totali</span>
          <span className="text-orange-300">{esecutive} esecutive</span>
        </div>
      </div>

      {/* Lista schede */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {schede.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#4e6585" }}>
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">Nessuna scheda presente</div>
          </div>
        ) : (
          schede.map((s) => {
            const quantita = s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {};
            const totale = calcolaTotaleQuantita(quantita as Record<string, number>);
            return (
              <Link
                key={s.id}
                href={`/m/schede/${s.id}`}
                className="block rounded-xl p-4 active:opacity-70 transition-opacity"
                style={{ backgroundColor: "#112240", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{s.nomeArticolo}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#4e6585" }}>{s.codice}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATO_STYLE[s.stato] ?? ""}`}>
                    {STATO_LABEL[s.stato] ?? s.stato}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "#8ba3c7" }}>
                  {s.cliente && <span>{s.cliente.nome}</span>}
                  {s.collezione && <span>{s.collezione}</span>}
                  {totale > 0 && <span>{totale} pz</span>}
                  <span className="ml-auto" style={{ color: "#4e6585" }}>{formatData(s.updatedAt.toISOString())}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs mb-1" style={{ color: "#4e6585" }}>DOUBLEU Production Sheet</div>
        <a href="/dashboard" className="text-xs text-blue-400">Versione desktop →</a>
      </div>
    </div>
  );
}
