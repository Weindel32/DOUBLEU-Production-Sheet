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
  const esecutive = await prisma.scheda.count({ where: { stato: "esecutiva" } });
  const bozze = await prisma.scheda.count({ where: { stato: "bozza" } });

  const stats = [
    { label: "Schede totali",  value: totaleSchede, icon: FileText,   href: "/schede",    bg: "bg-blue-700",   text: "text-white", sub: "text-blue-200" },
    { label: "Esecutive",      value: esecutive,    icon: TrendingUp, href: "/schede",    bg: "bg-green-600",  text: "text-white", sub: "text-green-200" },
    { label: "Bozze",          value: bozze,        icon: FileText,   href: "/schede",    bg: "bg-gray-500",   text: "text-white", sub: "text-gray-300" },
    { label: "Clienti / Club", value: clienti,      icon: Users,      href: "/clienti",   bg: "bg-orange-500", text: "text-white", sub: "text-orange-200" },
    { label: "Materiali",      value: materiali,    icon: Package,    href: "/materiali", bg: "bg-gray-700",   text: "text-white", sub: "text-gray-400" },
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
          <Link key={s.label} href={s.href} className={`${s.bg} rounded-xl p-4 flex flex-col gap-3 hover:opacity-90 transition-opacity cursor-pointer`}>
            <div className={`${s.text} opacity-80`}>
              <s.icon size={20} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
              <div className={`text-xs mt-0.5 ${s.sub}`}>{s.label}</div>
            </div>
          </Link>
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

    </div>
  );
}
