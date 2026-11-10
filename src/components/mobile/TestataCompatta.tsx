"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LinkElenco } from "@/components/ui/MemoriaElenco";

/**
 * Barra sottile che compare in alto quando il titolo grande è uscito dallo schermo:
 * nelle pagine lunghe "Indietro" e il titolo restano a portata di mano.
 */
export default function TestataCompatta({ titolo, indietro, elenco }: { titolo: string; indietro?: string; elenco?: boolean }) {
  const segno = useRef<HTMLSpanElement>(null);
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    const el = segno.current;
    if (!el) return;
    // Il segno sta in fondo alla testata grande: sparito sopra il bordo, entra la barra.
    const io = new IntersectionObserver(([e]) => setVisibile(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = "w-11 h-11 -ml-2 flex items-center justify-center text-[#1F3A68] flex-shrink-0";
  return (
    <>
      <span ref={segno} aria-hidden className="block h-px -mt-px" />
      <div inert={!visibile}
        className={`fixed top-0 inset-x-0 z-30 bg-[#F6F4EF]/90 backdrop-blur border-b border-[#E4E0D6] pt-[env(safe-area-inset-top)] transition-[opacity,transform] duration-200 ${
          visibile ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="max-w-xl mx-auto h-12 px-4 flex items-center gap-1">
          {indietro && (elenco
            ? <LinkElenco base={indietro} aria-label="Indietro" className={cls}><ChevronLeft size={24} /></LinkElenco>
            : <Link href={indietro} aria-label="Indietro" className={cls}><ChevronLeft size={24} /></Link>)}
          <span className="flex-1 min-w-0 font-display font-bold text-[17px] truncate">{titolo}</span>
        </div>
      </div>
    </>
  );
}
