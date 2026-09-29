export const dynamic = "force-dynamic";
import SchedaPagina from "@/components/scheda/SchedaPagina";

export default async function ArticoloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SchedaPagina id={id} percorso="/articoli" />;
}
