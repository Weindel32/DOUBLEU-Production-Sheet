export const dynamic = "force-dynamic";
import Link from "next/link";
import { Hourglass, ChevronRight, CheckCircle2 } from "lucide-react";
import Testata from "@/components/mobile/Testata";
import { datiHomeMobile } from "@/lib/dashboard";
import SpunteFornitore from "@/components/ordine/SpunteFornitore";

const consegna = (g: number | null) =>
  g === null ? "consegna da fissare" : g < 0 ? `scaduto da ${-g} gg` : g === 0 ? "consegna oggi" : g === 1 ? "consegna domani" : `consegna tra ${g} gg`;

/** Produzione dal telefono: cosa sollecitare o ordinare, e a che punto è ogni ordine in lavorazione. */
export default async function ProduzioneMobile() {
  // Stesso calcolo della Dashboard (solleciti e avanzamento), senza materiali e margini.
  const d = await datiHomeMobile().catch(() => null);
  const solleciti = d?.solleciti ?? [];
  const ordini = d?.ordini ?? [];

  return (
    <>
      <Testata sopra="Double U" titolo="Produzione" />
      <div className="px-4 space-y-3">
        {!d && <p role="alert" className="bg-white border border-[#F2D2C1] rounded-2xl p-4 text-[14px] text-[#A8461F]">Dati non disponibili ora: riprova tra poco.</p>}
        {d && solleciti.length === 0 && (
          <p className="bg-white border border-[#E4E0D6] rounded-2xl p-4 text-[14px] font-semibold text-[#1D6B4A] flex items-center gap-2">
            <CheckCircle2 size={18} /> Niente da sollecitare né da ordinare
          </p>
        )}
        {/* ── Da sollecitare: articoli fermi da più di una settimana, capi LS24 da ordinare ── */}
        {solleciti.length > 0 && (
          <section className="bg-white border border-[#F2D2C1] rounded-2xl overflow-hidden">
            <h2 className="px-4 pt-3.5 pb-2 flex items-center gap-2 font-display font-bold text-[17px] text-[#A8461F]">
              <Hourglass size={18} /> {solleciti.every((a) => a.tipo === "fornitore") ? "Da ordinare" : "Da sollecitare"} <span className="text-[13px] font-semibold">{solleciti.length}</span>
            </h2>
            <ul className="divide-y divide-[#EFEBE2]">
              {solleciti.map((a) => (
                <li key={a.href + a.testo}>
                  <Link href={a.tipo === "fornitore" ? "#ordini" : a.href.replace(/^\/schede\//, "/m/schede/")} className="flex items-center gap-3 px-4 py-3 active:bg-[#FBFAF7]">
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-[15px] leading-snug">{a.testo.replace(/^Sollecita: /, "")}</span>
                      <span className="block text-[13px] text-[#5F6878] truncate">{a.dettaglio}</span>
                    </span>
                    <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── In produzione: una riga per ordine aperto ── */}
        {ordini.length > 0 && (
          <section id="ordini" className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden scroll-mt-4">
            <h2 className="px-4 pt-3.5 pb-2 font-display font-bold text-[17px]">In produzione</h2>
            <ul className="divide-y divide-[#EFEBE2]">
              {ordini.map((o) => (
                <li key={o.id}>
                  <Link href={`/m/schede?ordine=${encodeURIComponent(o.id)}#ordine-${encodeURIComponent(o.id)}`} className="flex items-center gap-3 px-4 py-3 active:bg-[#FBFAF7]">
                    <span className="flex-1 min-w-0">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-[15px] text-[#1F3A68] truncate">{o.cliente}</span>
                        <span className={`text-xs flex-shrink-0 ${o.urgenza === "scaduto" || o.urgenza === "preavviso" ? "text-[#A8461F] font-semibold" : "text-[#5F6878]"}`}>{consegna(o.giorni)}</span>
                      </span>
                      <span className={`block text-[13px] font-semibold ${o.avanzamentoFasi.tempo?.chiuso ? "text-[#1D6B4A]" : "text-[#0E1B2C]"}`}>
                        {o.avanzamentoFasi.tempo?.testo ?? (o.soloAcquistati ? `Capi acquistati (${o.acquistati.linee.join(", ")}) · da consegnare` : o.esecutive ? "Fasi non ancora avviate" : `${o.bozze} schede in bozza`)}
                      </span>
                      {o.avanzamentoFasi.riepilogo && !o.avanzamentoFasi.tempo?.chiuso && (
                        <span className="block text-[13px] text-[#1F3A68] truncate">{o.avanzamentoFasi.riepilogo}</span>
                      )}
                    </span>
                    <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                  </Link>
                  {o.fornitore && <div className="px-4 pb-3"><SpunteFornitore ordineId={o.id} stato={o.fornitore} compatto /></div>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {d && ordini.length === 0 && (
          <p className="bg-white border border-[#E4E0D6] rounded-2xl p-4 text-[14px] text-[#5F6878]">Nessun ordine confermato o in produzione.</p>
        )}
      </div>
    </>
  );
}
