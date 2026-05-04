export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, PlusCircle } from "lucide-react";
import MaterialiActions from "./MaterialiActions";

export default async function MaterialiPage() {
  const materiali = await prisma.materiale.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Materiali</h1>
          <p className="text-sm text-gray-500 mt-0.5">{materiali.length} materiali in libreria</p>
        </div>
        <Link
          href="/materiali/nuovo"
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Aggiungi materiale
        </Link>
      </div>

      {materiali.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-gray-600 font-medium mb-2">Nessun materiale</h2>
          <p className="text-gray-400 text-sm mb-4">Aggiungi tessuti e materiali alla libreria</p>
          <Link
            href="/materiali/nuovo"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <PlusCircle size={16} />
            Aggiungi materiale
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Composizione</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Peso</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Fornitore</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Costo/metro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materiali.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{m.tipo}</td>
                  <td className="px-4 py-3 text-gray-600">{m.composizione || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.peso ? (
                      <span>
                        {m.peso} {m.unitaPeso ?? "g/m²"}
                        {m.unitaPeso === "g/m" && (() => {
                          const p = parseFloat(m.peso.replace(",", "."));
                          return p > 0 ? <span className="text-xs text-blue-400 ml-1">({(1000 / p).toFixed(2)} m/kg)</span> : null;
                        })()}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.fornitore || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {m.costoMetro ? `€ ${m.costoMetro.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 w-20">
                    <MaterialiActions id={m.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
