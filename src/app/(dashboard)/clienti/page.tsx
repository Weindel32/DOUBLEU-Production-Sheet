export const dynamic = "force-dynamic";
import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { clientiOrderApp, orderAppConfigurata } from "@/lib/orderApp";

/** Clienti / club: l'anagrafica vive nell'Order App, qui servono solo il nome e le schede di ciascuno. */
export default async function ClientiPage() {
  const [locali, daOrderApp] = await Promise.all([
    prisma.cliente.findMany({ include: { _count: { select: { schede: true } } } }),
    clientiOrderApp(),
  ]);
  const schedePer = new Map(locali.filter((c) => c.orderAppId).map((c) => [c.orderAppId!, c._count.schede]));
  const righe = [
    ...daOrderApp.map((c) => ({ key: c.id, nome: c.nome, citta: c.citta, schede: schedePer.get(c.id) ?? 0 })),
    // Clienti creati qui prima del collegamento all'Order App, se ne restano.
    ...locali.filter((c) => !c.orderAppId || !daOrderApp.some((o) => o.id === c.orderAppId))
      .map((c) => ({ key: c.id, nome: c.nome, citta: c.citta, schede: c._count.schede })),
  ].sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">Clienti / Club</h1>
        <p className="text-sm text-[#5F6878] mt-1">
          {righe.length} clienti · si creano e si modificano nell&apos;Order App
        </p>
      </div>

      {!orderAppConfigurata() && (
        <div role="alert" className="rounded-xl border border-[#E8C98A] bg-[#FBF3DF] px-4 py-3 text-sm text-[#7A5B12]">
          Order App non collegata: mancano ORDER_APP_SUPABASE_URL e ORDER_APP_SUPABASE_KEY.
        </div>
      )}

      {righe.length === 0 ? (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-16 px-6">
          <Users size={44} className="mx-auto mb-4 text-[#5F6878]" />
          <p className="text-[#5F6878] text-sm">Nessun cliente.</p>
        </div>
      ) : (
        <ul className="bg-white border border-[#E4E0D6] rounded-2xl divide-y divide-[#EFEBE2] overflow-hidden">
          {righe.map((c) => (
            <li key={c.key} className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#1F3A68] truncate">{c.nome}</div>
                {c.citta && <div className="text-[13px] text-[#5F6878]">{c.citta}</div>}
              </div>
              {c.schede > 0 ? (
                <Link href={`/schede?q=${encodeURIComponent(c.nome)}`}
                  className="h-10 px-3.5 rounded-lg border border-[#D6D1C4] text-[13px] font-semibold text-[#0E1B2C] inline-flex items-center hover:border-[#0E1B2C]/40">
                  {c.schede} {c.schede === 1 ? "scheda" : "schede"}
                </Link>
              ) : <span className="text-[13px] text-[#5F6878]">Nessuna scheda</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
