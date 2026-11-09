export const dynamic = "force-dynamic";
import Link from "next/link";
import { PackagePlus, Tag, Receipt, Calculator, FileText, Palette, Hourglass, ChevronRight } from "lucide-react";
import Testata from "@/components/mobile/Testata";
import { BUILD } from "@/lib/build";
import { datiDashboard } from "@/lib/dashboard";

const AZIONI = [
  { href: "/m/materiali/nuovo", titolo: "Nuovo materiale", testo: "Dal fornitore, con foto del cartellino", icon: PackagePlus },
  { href: "/m/materiali", titolo: "Aggiorna un prezzo", testo: "Il cambio resta nelle note, con la data", icon: Tag },
  { href: "/m/campioni", titolo: "Spesa campione", testo: "Taglio, cartamodello, confezione…", icon: Receipt },
  { href: "/m/costi", titolo: "Costo al volo", testo: "Costo, margine e prezzo per un articolo", icon: Calculator },
];

const consegna = (g: number | null) =>
  g === null ? "consegna da fissare" : g < 0 ? `scaduto da ${-g} gg` : g === 0 ? "consegna oggi" : g === 1 ? "consegna domani" : `consegna tra ${g} gg`;

export default async function MobileHome() {
  // Stessi dati della Dashboard: solleciti e avanzamento non vanno ricalcolati in modo diverso sul telefono.
  const d = await datiDashboard().catch(() => null);
  const solleciti = d?.azioni.filter((a) => a.tipo === "fermo") ?? [];
  const ordini = d?.ordini ?? [];

  return (
    <>
      <Testata sopra="Double U" titolo="Cosa ti serve?" />
      <div className="px-4 space-y-3">
        {/* ── Da sollecitare: articoli fermi da più di una settimana ── */}
        {solleciti.length > 0 && (
          <section className="bg-white border border-[#F2D2C1] rounded-2xl overflow-hidden">
            <h2 className="px-4 pt-3.5 pb-2 flex items-center gap-2 font-display font-bold text-[17px] text-[#A8461F]">
              <Hourglass size={18} /> Da sollecitare <span className="text-[13px] font-semibold">{solleciti.length}</span>
            </h2>
            <ul className="divide-y divide-[#EFEBE2]">
              {solleciti.map((a) => (
                <li key={a.href + a.testo}>
                  <Link href={a.href.replace(/^\/schede\//, "/m/schede/")} className="flex items-center gap-3 px-4 py-3 active:bg-[#FBFAF7]">
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
          <section className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
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
                        {o.avanzamentoFasi.tempo?.testo ?? (o.esecutive ? "Fasi non ancora avviate" : `${o.bozze} schede in bozza`)}
                      </span>
                      {o.avanzamentoFasi.riepilogo && !o.avanzamentoFasi.tempo?.chiuso && (
                        <span className="block text-[13px] text-[#1F3A68] truncate">{o.avanzamentoFasi.riepilogo}</span>
                      )}
                    </span>
                    <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          {AZIONI.map(({ href, titolo, testo, icon: Icon }) => (
            <Link key={href} href={href}
              className="bg-white border border-[#E4E0D6] rounded-2xl p-4 min-h-[140px] flex flex-col justify-between active:bg-[#FBFAF7]">
              <span className="w-11 h-11 rounded-xl bg-[#0E1B2C] text-white flex items-center justify-center"><Icon size={22} /></span>
              <span>
                <span className="block font-display font-bold text-[17px] leading-tight">{titolo}</span>
                <span className="block text-[13px] text-[#5F6878] leading-snug mt-1">{testo}</span>
              </span>
            </Link>
          ))}
        </div>

        <Link href="/m/colori" className="flex items-center gap-3 bg-white border border-[#E4E0D6] rounded-2xl p-4 active:bg-[#FBFAF7]">
          <span className="w-11 h-11 rounded-xl bg-[#E3E9F3] text-[#1F3A68] flex items-center justify-center"><Palette size={22} /></span>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px]">Cerca un colore</span>
            <span className="block text-[13px] text-[#5F6878]">In quali tessuti c&apos;è e con che codice si ordina</span>
          </span>
        </Link>

        <Link href="/m/schede" className="flex items-center gap-3 bg-white border border-[#E4E0D6] rounded-2xl p-4 active:bg-[#FBFAF7]">
          <span className="w-11 h-11 rounded-xl bg-[#E3E9F3] text-[#1F3A68] flex items-center justify-center"><FileText size={22} /></span>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px]">Ordini e schede</span>
            <span className="block text-[13px] text-[#5F6878]">Schede per ordine, cosa acquistare, stampa e invio</span>
          </span>
        </Link>

        <p className="text-center font-mono text-xs text-[#5F6878] pt-1">build {BUILD}</p>
      </div>
    </>
  );
}
