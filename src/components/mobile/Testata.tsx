import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Intestazione delle pagine mobile: titolo grande, ritorno opzionale, spazio per la notch. */
export default function Testata({ titolo, sopra, indietro, destra }: {
  titolo: string; sopra?: string; indietro?: string; destra?: ReactNode;
}) {
  return (
    <header className="px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3">
      {indietro && (
        <Link href={indietro} className="inline-flex items-center gap-0.5 h-10 -ml-1.5 text-[15px] text-[#1F3A68] font-medium">
          <ChevronLeft size={20} /> Indietro
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {sopra && <div className="text-xs font-semibold tracking-wider uppercase text-[#5F6878]">{sopra}</div>}
          <h1 className="font-display text-[28px] font-extrabold tracking-tight leading-tight truncate">{titolo}</h1>
        </div>
        {destra}
      </div>
    </header>
  );
}
