export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, PlusCircle } from "lucide-react";
import MaterialiActions from "./MaterialiActions";
import { calcolaCostoAlMetro, calcolaGrammaturaCommerciale } from "@/lib/utils";

function mPerKg(peso: string): string | null {
  const p = parseFloat(peso.replace(",", "."));
  if (!p || p <= 0) return null;
  return (1000 / p).toFixed(2);
}

const UNITA_LABEL: Record<string, string> = { metro: "/m", kg: "/kg", pz: "/pz" };

export default async function MaterialiPage() {
  const materiali = await prisma.materiale.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Materiali</h1>
          <p className="text-sm text-[#8ba3c7] mt-0.5">{materiali.length} materiali in libreria</p>
        </div>
        <Link
          href="/materiali/nuovo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Aggiungi materiale
        </Link>
      </div>

      {materiali.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-[#4e6585]" />
          <h2 className="text-[#8ba3c7] font-medium mb-2">Nessun materiale</h2>
          <p className="text-[#4e6585] text-sm mb-4">Aggiungi tessuti e materiali alla libreria</p>
          <Link
            href="/materiali/nuovo"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <PlusCircle size={16} />
            Aggiungi materiale
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/7">
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Composizione</th>
                <th className="text-left px-4 py-3">Peso</th>
                <th className="text-left px-4 py-3">Grammatura commerciale</th>
                <th className="text-left px-4 py-3">Fornitore</th>
                <th className="text-right px-4 py-3">Costo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {materiali.map((m) => {
                const unita = m.unitaMisura ?? "metro";
                const costoAlMetro = calcolaCostoAlMetro(m);
                const grammaturaCommerciale = calcolaGrammaturaCommerciale(m);
                return (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{m.nome}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{m.tipo}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{m.composizione || "—"}</td>
                  <td className="px-4 py-3 text-[#8ba3c7]">
                    {m.peso ? (
                      <span>
                        {m.peso} {m.unitaPeso ?? "g/m²"}
                        {m.unitaPeso === "g/m" && mPerKg(m.peso) && (
                          <span className="text-xs text-blue-400 ml-1">({mPerKg(m.peso)} m/kg)</span>
                        )}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#8ba3c7]">
                    {grammaturaCommerciale !== null ? `${grammaturaCommerciale.toFixed(0)} g/m²` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#8ba3c7]">{m.fornitore || "—"}</td>
                  <td className="px-4 py-3 text-right text-[#8ba3c7]">
                    {m.costoMetro ? (
                      <span>
                        € {m.costoMetro.toFixed(2)}{UNITA_LABEL[unita] ?? "/m"}
                        {unita === "kg" && (
                          costoAlMetro !== null
                            ? <span className="text-xs text-blue-400 block">≈ €{costoAlMetro.toFixed(2)}/m</span>
                            : <span className="text-xs text-orange-400 block">peso/altezza mancanti</span>
                        )}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 w-20">
                    <MaterialiActions id={m.id} />
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
