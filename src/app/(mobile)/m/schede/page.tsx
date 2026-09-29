export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Shirt } from "lucide-react";
import { formatData, calcolaTotaleQuantita, STATI_SCHEDA, TIPI_COSTO_DB } from "@/lib/utils";
import Testata from "@/components/mobile/Testata";

/** Schede di produzione in consultazione: di default le esecutive, cioè quelle in lavorazione. */
export default async function MobileSchedePage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const stato = sp.stato === "bozza" ? "bozza" : "esecutiva";
  const [schede, conteggi] = await Promise.all([
    prisma.scheda.findMany({
      where: { stato, tipo: { notIn: TIPI_COSTO_DB } },
      include: { cliente: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.scheda.groupBy({ by: ["stato"], where: { tipo: { notIn: TIPI_COSTO_DB } }, _count: { _all: true } }),
  ]);
  const n = (s: string) => conteggi.find((c) => c.stato === s)?._count._all ?? 0;

  return (
    <>
      <Testata sopra="Double U" titolo="Schede produzione" />
      <div className="px-4 space-y-3">
        <div role="group" aria-label="Stato" className="flex bg-[#EEEBE3] rounded-xl p-1">
          {STATI_SCHEDA.slice().reverse().map((s) => {
            const on = s.value === stato;
            return (
              <Link key={s.value} href={s.value === "esecutiva" ? "/m/schede" : "/m/schede?stato=bozza"} aria-current={on ? "true" : undefined}
                className={`flex-1 h-11 rounded-lg flex items-center justify-center gap-1.5 text-[15px] ${on ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
                {s.label === "Esecutiva" ? "Esecutive" : "Bozze"} <span className="text-xs text-[#5F6878] font-normal">{n(s.value)}</span>
              </Link>
            );
          })}
        </div>

        <ul className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
          {schede.length === 0 && <li className="p-8 text-center text-[#5F6878]">Nessuna scheda {stato === "bozza" ? "in bozza" : "esecutiva"}.</li>}
          {schede.map((s) => {
            const totale = calcolaTotaleQuantita(s.quantitaTaglia ? JSON.parse(s.quantitaTaglia) : {});
            const immagini: string[] = s.immagini ? JSON.parse(s.immagini) : [];
            return (
              <li key={s.id} className="border-b border-[#EFEBE2] last:border-0">
                <Link href={`/m/schede/${s.id}`} className="flex items-center gap-3 px-3 py-3 active:bg-[#FBFAF7]">
                  <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                    {immagini[0] ? <img src={immagini[0]} alt="" className="w-full h-full object-cover" /> : <Shirt size={20} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{s.nomeArticolo}</span>
                    <span className="block text-[13px] text-[#5F6878] truncate">
                      <span className="font-mono">{s.codiceModello || s.codice}</span>
                      {s.cliente && <> · {s.cliente.nome}</>}
                      {totale > 0 && <> · {totale} pz</>}
                    </span>
                  </span>
                  <span className="text-xs text-[#5F6878] flex-shrink-0">{formatData(s.updatedAt.toISOString())}</span>
                  <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
