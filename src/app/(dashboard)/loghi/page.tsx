export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Image, PlusCircle } from "lucide-react";
import { formatData } from "@/lib/utils";

export default async function LoghiPage() {
  const loghi = await prisma.logo.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Libreria Loghi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{loghi.length} loghi disponibili</p>
        </div>
        <Link
          href="/loghi/nuovo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Aggiungi logo
        </Link>
      </div>

      {loghi.length === 0 ? (
        <div className="card text-center py-16">
          <Image size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-gray-600 font-medium mb-2">Nessun logo</h2>
          <p className="text-gray-400 text-sm mb-4">Carica i loghi da usare nelle schede</p>
          <Link
            href="/loghi/nuovo"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <PlusCircle size={16} />
            Aggiungi logo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loghi.map((l) => (
            <div key={l.id} className="card hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                {l.file ? (
                  <img src={l.file} alt={l.nome} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <Image size={24} className="text-gray-300" />
                )}
              </div>
              <div className="font-medium text-gray-800 text-sm">{l.nome}</div>
              <div className="text-xs text-gray-400 mt-0.5">{l.tipo}</div>
              <div className="text-xs text-gray-300 mt-1">{formatData(l.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
