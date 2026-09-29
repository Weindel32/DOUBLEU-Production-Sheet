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
          <h1 className="text-2xl font-bold text-[#0E1B2C]">Materiali</h1>
          <p className="text-sm text-[#4A5566] mt-0.5">{materiali.length} materiali in libreria</p>
        </div>
        <Link
          href="/materiali/nuovo"
          className="flex items-center gap-2 bg-[#0E1B2C] hover:bg-[#1F3A68] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Aggiungi materiale
        </Link>
      </div>

      {materiali.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-[#5F6878]" />
          <h2 className="text-[#4A5566] font-medium mb-2">Nessun materiale</h2>
          <p className="text-[#5F6878] text-sm mb-4">Aggiungi tessuti e materiali alla libreria</p>
          <Link
            href="/materiali/nuovo"
            className="inline-flex items-center gap-2 bg-[#0E1B2C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1F3A68] transition-colors"
          >
            <PlusCircle size={16} />
            Aggiungi materiale
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E0D6]">
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
                <tr key={m.id} className="border-b border-[#E4E0D6] hover:bg-[#0E1B2C]/[0.03] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0E1B2C]">{m.nome}</td>
                  <td className="px-4 py-3 text-[#4A5566]">{m.tipo}</td>
                  <td className="px-4 py-3 text-[#4A5566]">{m.composizione || "—"}</td>
                  <td className="px-4 py-3 text-[#4A5566]">
                    {m.peso ? (
                      <span>
                        {m.peso} {m.unitaPeso ?? "g/m²"}
                        {m.unitaPeso === "g/m" && mPerKg(m.peso) && (
                          <span className="text-xs text-[#1F3A68] ml-1">({mPerKg(m.peso)} m/kg)</span>
                        )}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#4A5566]">
                    {grammaturaCommerciale !== null ? `${grammaturaCommerciale.toFixed(0)} g/m²` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#4A5566]">{m.fornitore || "—"}</td>
                  <td className="px-4 py-3 text-right text-[#4A5566]">
                    {unita === "kg" ? (
                      costoAlMetro !== null || m.prezzoKg ? (
                        <span>
                          {costoAlMetro !== null
                            ? `€ ${costoAlMetro.toFixed(2)}/m`
                            : <span className="text-[#A8461F]">peso/altezza mancanti</span>}
                          {m.prezzoKg ? <span className="text-xs text-[#1F3A68] block">€{m.prezzoKg.toFixed(2)}/kg</span> : null}
                        </span>
                      ) : "—"
                    ) : m.costoMetro ? (
                      <span>€ {m.costoMetro.toFixed(2)}{UNITA_LABEL[unita] ?? "/m"}</span>
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
