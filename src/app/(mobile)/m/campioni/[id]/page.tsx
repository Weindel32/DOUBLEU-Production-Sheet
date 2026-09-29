export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Testata from "@/components/mobile/Testata";
import SpesaCampioneForm from "@/components/mobile/SpesaCampioneForm";
import type { Campione } from "@/types";

export default async function SpesaCampioneMobile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.scheda.findUnique({
    where: { id },
    select: { id: true, codice: true, codiceModello: true, nomeArticolo: true, campioni: true },
  });
  if (!s) notFound();
  const campioni: Campione[] = s.campioni ? JSON.parse(s.campioni) : [];
  return (
    <>
      <Testata indietro="/m/campioni" sopra={s.codiceModello || s.codice} titolo={s.nomeArticolo} />
      <SpesaCampioneForm schedaId={s.id} campioniIniziali={campioni} />
    </>
  );
}
