import Link from "next/link";
import { PackagePlus, Tag, Receipt, Calculator, FileText, Monitor } from "lucide-react";
import Testata from "@/components/mobile/Testata";

const AZIONI = [
  { href: "/m/materiali/nuovo", titolo: "Nuovo materiale", testo: "Dal fornitore, con foto del cartellino", icon: PackagePlus },
  { href: "/m/materiali", titolo: "Aggiorna un prezzo", testo: "Il cambio resta nelle note, con la data", icon: Tag },
  { href: "/m/campioni", titolo: "Spesa campione", testo: "Taglio, cartamodello, confezione…", icon: Receipt },
  { href: "/m/costi", titolo: "Costo al volo", testo: "Costo, margine e prezzo per un articolo", icon: Calculator },
];

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

        <Link href="/m/schede" className="flex items-center gap-3 bg-white border border-[#E4E0D6] rounded-2xl p-4 active:bg-[#FBFAF7]">
          <span className="w-11 h-11 rounded-xl bg-[#E3E9F3] text-[#1F3A68] flex items-center justify-center"><FileText size={22} /></span>
          <span className="flex-1">
            <span className="block font-display font-bold text-[17px]">Schede produzione</span>
            <span className="block text-[13px] text-[#5F6878]">Consulta misure, quantità e note</span>
          </span>
        </Link>

        <Link href="/dashboard" className="flex items-center justify-center gap-2 h-12 text-sm font-medium text-[#1F3A68]">
          <Monitor size={17} /> Apri la versione completa
        </Link>
      </div>
    </>
  );
}
