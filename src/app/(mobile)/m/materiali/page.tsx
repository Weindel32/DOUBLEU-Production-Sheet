export const dynamic = "force-dynamic";
import Link from "next/link";
import { Plus, Palette } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Testata from "@/components/mobile/Testata";
import ElencoMateriali from "@/components/mobile/ElencoMateriali";
import { prezzoListino } from "@/lib/materiali";

export default async function MaterialiMobile({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const materiali = await prisma.materiale.findMany({ orderBy: { nome: "asc" } });
  const righe = materiali.map((m) => ({
    id: m.id, nome: m.nome, tipo: m.tipo, fornitore: m.fornitore, codice: m.codice, foto: m.foto,
    composizione: m.composizione, prezzo: prezzoListino(m),
  }));
  return (
    <>
      <Testata sopra="Double U" titolo="Materiali" destra={
        <Link href="/m/materiali/nuovo" aria-label="Nuovo materiale"
          className="w-12 h-12 rounded-full bg-[#0E1B2C] text-white flex items-center justify-center flex-shrink-0"><Plus size={24} /></Link>
      } />
      <div className="px-4 mb-3">
        <Link href="/m/colori" className="h-11 px-4 rounded-xl border border-[#D6D1C4] bg-white text-[14px] font-medium text-[#1F3A68] inline-flex items-center gap-2">
          <Palette size={17} /> Cerca per colore
        </Link>
      </div>
      {sp.salvato === "1" && (
        <p role="status" className="mx-4 mb-3 text-sm text-[#1D6B4A] bg-[#DDEFE5] rounded-xl px-4 py-3">Materiale salvato.</p>
      )}
      <ElencoMateriali materiali={righe} />
    </>
  );
}
