export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { FileText, Users, Package, CheckCircle2, Edit3 } from "lucide-react";
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
    {
      label: "Schede totali",
      value: totaleSchede,
      icon: FileText,
      href: "/schede",
      iconBg: "bg-blue-500/20",
      iconColor: "text-[#1F3A68]",
    },
    {
      label: "Esecutive",
      value: esecutive,
      icon: CheckCircle2,
      href: "/schede",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-[#1D6B4A]",
    },
    {
      label: "Bozze",
      value: bozze,
      icon: Edit3,
      href: "/schede",
      iconBg: "bg-orange-500/20",
      iconColor: "text-[#A8461F]",
    },
    {
      label: "Clienti / Club",
      value: clienti,
      icon: Users,
      href: "/clienti",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-700",
    },
    {
      label: "Materiali",
      value: materiali,
      icon: Package,
      href: "/materiali",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0E1B2C]">Dashboard</h1>
        <p className="text-[#4A5566] text-sm mt-1">Panoramica produzione Double U</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card hover:bg-[#FBFAF7] transition-colors cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.iconColor} />
            </div>
            <div className="text-3xl font-bold text-[#0E1B2C]">{s.value}</div>
            <div className="text-xs mt-1 text-[#4A5566] uppercase tracking-wide font-medium">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Ultime schede */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#0E1B2C]">Ultime schede modificate</h2>
          <Link href="/schede" className="text-sm text-[#1F3A68] hover:text-[#1F3A68] transition-colors">
            Vedi tutte →
          </Link>
        </div>

        {schede.length === 0 ? (
          <div className="text-center py-8 text-[#5F6878]">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nessuna scheda creata</p>
            <Link
              href="/schede/nuova"
              className="mt-3 inline-block text-sm text-[#1F3A68] hover:text-[#1F3A68]"
            >
              Crea la prima scheda
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {schede.map((s) => {
              const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
              return (
                <Link
                  key={s.id}
                  href={`/schede/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-[#0E1B2C]/[0.03] -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-medium text-[#0E1B2C] text-sm">{s.nomeArticolo}</div>
                    <div className="text-xs text-[#4A5566] mt-0.5">
                      {s.codice} · {s.cliente?.nome
                        ? <span className="font-semibold text-[#1F3A68]">{s.cliente.nome}</span>
                        : "Nessun cliente"} · {formatData(s.updatedAt)}
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
