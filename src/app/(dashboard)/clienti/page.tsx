export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, PlusCircle } from "lucide-react";
import { formatData } from "@/lib/utils";

export default async function ClientiPage() {
  const clienti = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { schede: true } } },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clienti / Club</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clienti.length} clienti registrati</p>
        </div>
        <Link
          href="/clienti/nuovo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Nuovo cliente
        </Link>
      </div>

      {clienti.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-gray-600 font-medium mb-2">Nessun cliente</h2>
          <p className="text-gray-400 text-sm mb-4">Aggiungi il primo cliente o club sportivo</p>
          <Link
            href="/clienti/nuovo"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <PlusCircle size={16} />
            Nuovo cliente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clienti.map((c) => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {c.nome[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-400">{c._count.schede} schede</span>
              </div>
              <div className="font-semibold text-gray-800 mb-1">{c.nome}</div>
              {c.email && <div className="text-sm text-gray-500">{c.email}</div>}
              {c.telefono && <div className="text-sm text-gray-500">{c.telefono}</div>}
              {c.indirizzo && <div className="text-xs text-gray-400 mt-1">{c.indirizzo}</div>}
              <div className="text-xs text-gray-300 mt-2">Aggiunto il {formatData(c.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
