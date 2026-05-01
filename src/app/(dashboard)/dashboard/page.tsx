export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { FileText, Users, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatData, STATI_SCHEDA } from "@/lib/utils";

export default async function DashboardPage() {
  const [schede, clienti, materiali] = await Promise.all([
    prisma.scheda.findMany({ orderBy: { updatedAt: "desc" }, take: 5, include: { cliente: true } }),
    prisma.cliente.count(),
    prisma.materiale.count(),
  ]);

  const totaleSchede = await prisma.scheda.count();
  const inProduzione = await prisma.scheda.count({ where: { stato: "produzione" } });
  const approvate = await prisma.scheda.count({ where: { stato: "approvata" } });

  const stats = [
    { label: "Schede totali", value: totaleSchede, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "In produzione", value: inProduzione, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Approvate", value: approvate, icon: FileText, color: "text-purple-600 bg-purple-50" },
    { label: "Clienti / Club", value: clienti, icon: Users, color: "text-orange-600 bg-orange-50" },
    { label: "Materiali", value: materiali, icon: Package, color: "text-gray-600 bg-gray-100" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Panoramica produzione Double U</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`p-2 rounded-lg ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ultime schede */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Ultime schede modificate</h2>
          <Link href="/schede" className="text-sm text-blue-600 hover:underline">
            Vedi tutte →
          </Link>
        </div>

        {schede.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nessuna scheda creata</p>
            <Link
              href="/schede/nuova"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              Crea la prima scheda
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {schede.map((s) => {
              const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
              return (
                <Link
                  key={s.id}
                  href={`/schede/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{s.nomeArticolo}</div>
                    <div className="text-xs text-gray-400">
                      {s.codice} · {s.cliente?.nome || "Nessun cliente"} · {formatData(s.updatedAt)}
                    </div>
                  </div>
                  {stato && (
                    <span className={`badge badge-${s.stato}`}>{stato.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pipeline stati */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Pipeline produzione</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {STATI_SCHEDA.map((stato, i) => (
            <div key={stato.value} className="flex items-center gap-2">
              <span className={`badge badge-${stato.value}`}>{stato.label}</span>
              {i < STATI_SCHEDA.length - 1 && (
                <span className="text-gray-300 text-lg">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
