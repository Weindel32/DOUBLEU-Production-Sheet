export const dynamic = "force-dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { PackagePlus, Tag, Receipt, Calculator, Palette, ChevronRight, BookOpen, Factory } from "lucide-react";
import Testata from "@/components/mobile/Testata";
import { BUILD } from "@/lib/build";
import { datiHomeMobile } from "@/lib/dashboard";

const AZIONI = [
  { href: "/m/materiali/nuovo", titolo: "Nuovo materiale", testo: "Dal fornitore, con foto del cartellino", icon: PackagePlus },
  { href: "/m/materiali", titolo: "Aggiorna un prezzo", testo: "Il cambio resta nelle note, con la data", icon: Tag },
  { href: "/m/campioni", titolo: "Spesa campione", testo: "Taglio, cartamodello, confezione…", icon: Receipt },
  { href: "/m/costi", titolo: "Costo al volo", testo: "Costo e prezzo per margine di un articolo", icon: Calculator },
];

/**
 * Riepilogo in una riga della produzione, che porta alla sua pagina. Arriva dopo le azioni
 * (Suspense): la Home si apre subito anche se il conto degli ordini richiede un attimo.
 */
async function RiepilogoProduzione() {
  const d = await datiHomeMobile().catch(() => null);
  const daOrdinare = d?.solleciti.filter((a) => a.tipo === "fornitore").length ?? 0;
  const daSollecitare = (d?.solleciti.length ?? 0) - daOrdinare;
  const parti = d ? [
    daSollecitare ? `${daSollecitare} da sollecitare` : null,
    daOrdinare ? `${daOrdinare} da ordinare` : null,
    `${d.ordini.length} ${d.ordini.length === 1 ? "ordine" : "ordini"} in lavorazione`,
  ].filter(Boolean) : ["Ordini in lavorazione, solleciti e ordini fornitore"];
  const attenzione = daSollecitare + daOrdinare > 0;
  return (
    <Link href="/m/produzione" className={`flex items-center gap-3 bg-white border rounded-2xl p-4 active:bg-[#FBFAF7] ${attenzione ? "border-[#F2D2C1]" : "border-[#E4E0D6]"}`}>
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${attenzione ? "bg-[#FBEDE5] text-[#A8461F]" : "bg-[#E3E9F3] text-[#1F3A68]"}`}><Factory size={22} /></span>
      <span className="flex-1 min-w-0">
        <span className="block font-display font-bold text-[17px]">Produzione</span>
        <span className={`block text-[13px] leading-snug ${attenzione ? "text-[#A8461F] font-semibold" : "text-[#5F6878]"}`}>{parti.join(" · ")}</span>
      </span>
      <ChevronRight size={18} className="text-[#C9C3B5] flex-shrink-0" />
    </Link>
  );
}

export default function MobileHome() {
  return (
    <>
      <Testata sopra="Double U" titolo="Cosa ti serve?" />
      <div className="px-4 space-y-3">
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

        <Suspense fallback={<div className="h-[76px] rounded-2xl bg-[#EEEBE3] animate-pulse" aria-label="Caricamento produzione" />}>
          <RiepilogoProduzione />
        </Suspense>

        <Link href="/m/colori" className="flex items-center gap-3 bg-white border border-[#E4E0D6] rounded-2xl p-4 active:bg-[#FBFAF7]">
          <span className="w-11 h-11 rounded-xl bg-[#E3E9F3] text-[#1F3A68] flex items-center justify-center"><Palette size={22} /></span>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px]">Cerca un colore</span>
            <span className="block text-[13px] text-[#5F6878]">In quali tessuti c&apos;è e con che codice si ordina</span>
          </span>
        </Link>

        <Link href="/m/modelli" className="flex items-center gap-3 bg-white border border-[#E4E0D6] rounded-2xl p-4 active:bg-[#FBFAF7]">
          <span className="w-11 h-11 rounded-xl bg-[#E3E9F3] text-[#1F3A68] flex items-center justify-center"><BookOpen size={22} /></span>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px]">Modelli</span>
            <span className="block text-[13px] text-[#5F6878]">Archivio dei cartamodelli per categoria, con foto e note</span>
          </span>
        </Link>

        <p className="text-center font-mono text-xs text-[#5F6878] pt-1">build {BUILD}</p>
      </div>
    </>
  );
}
