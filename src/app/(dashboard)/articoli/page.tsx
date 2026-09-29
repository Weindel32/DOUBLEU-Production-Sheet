export const dynamic = "force-dynamic";
import ListaSchede from "@/components/scheda/ListaSchede";

export default async function ArticoliPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <ListaSchede vista="articoli" searchParams={await searchParams} />;
}
