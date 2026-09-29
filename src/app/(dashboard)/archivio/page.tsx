export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Archive } from "lucide-react";
import { formatData, STATI_SCHEDA } from "@/lib/utils";

export default async function ArchivioPage() {
  const schede = await prisma.scheda.findMany({
    where: { stato: "esecutiva" },
    orderBy: { updatedAt: "desc" },
    include: { cliente: true },
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#0E1B2C]">Archivio</h1>
        <p className="text-sm text-[#4A5566] mt-0.5">Schede esecutive · {schede.length} elementi</p>
      </div>

      {schede.length === 0 ? (
        <div className="card text-center py-16">
          <Archive size={48} className="mx-auto mb-4 text-[#5F6878]" />
          <h2 className="text-[#4A5566] font-medium mb-2">Archivio vuoto</h2>
          <p className="text-[#5F6878] text-sm">Le schede consegnate appariranno qui</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0E1B2C]/[0.03] border-b border-[#E4E0D6]">
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Articolo</th>
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Codice</th>
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Collezione</th>
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Stato</th>
                <th className="text-left px-4 py-3 text-[#4A5566] font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {schede.map((s) => {
                const stato = STATI_SCHEDA.find((x) => x.value === s.stato);
                return (
                  <tr key={s.id} className="hover:bg-[#0E1B2C]/[0.03]">
                    <td className="px-4 py-3">
                      <Link href={`/schede/${s.id}`} className="font-medium text-[#0E1B2C] hover:text-[#1F3A68]">
                        {s.nomeArticolo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4A5566]">{s.codice}</td>
                    <td className="px-4 py-3 text-[#4A5566]">{s.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3 text-[#4A5566]">{s.collezione || "—"}</td>
                    <td className="px-4 py-3">
                      {stato && <span className={`badge badge-${s.stato}`}>{stato.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#5F6878]">{formatData(s.updatedAt)}</td>
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
