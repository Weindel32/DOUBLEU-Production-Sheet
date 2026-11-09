"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Ricorda, per sessione, quali blocchi di un elenco sono aperti, dove si era scrollato e con quali filtri:
// aprendo una scheda e tornando indietro si ritrova l'elenco esattamente com'era.

type Memoria = { url: string; aperti: string[]; scroll: number };

const chiave = (base: string) => `elenco:${base}`;

function leggi(base: string): Memoria | null {
  try {
    const v = sessionStorage.getItem(chiave(base));
    return v ? (JSON.parse(v) as Memoria) : null;
  } catch {
    return null;
  }
}

function scrivi(base: string, m: Memoria) {
  try { sessionStorage.setItem(chiave(base), JSON.stringify(m)); } catch { /* storage non disponibile */ }
}

/** Primo antenato che scorre (il <main> su desktop), altrimenti la finestra. */
function contenitore(el: HTMLElement | null): HTMLElement | null {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if (o === "auto" || o === "scroll") return n;
  }
  return null;
}

/**
 * Da mettere una volta nella pagina dell'elenco. I blocchi da ricordare sono <details data-blocco="id">.
 * `base` è il percorso dell'elenco ("/schede", "/m/schede").
 */
export default function MemoriaElenco({ base }: { base: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const url = location.pathname + location.search;
    const blocchi = () => [...document.querySelectorAll<HTMLDetailsElement>("details[data-blocco]")];
    const scroller = () => contenitore(ref.current);
    const posizione = () => scroller()?.scrollTop ?? window.scrollY;
    const salva = () => scrivi(base, { url, aperti: blocchi().filter((d) => d.open).map((d) => d.dataset.blocco!), scroll: posizione() });

    // Stesso elenco (stessi filtri) di prima: riapro gli stessi blocchi e torno allo stesso punto.
    const m = leggi(base);
    if (m && m.url === url) {
      for (const d of blocchi()) d.open = m.aperti.includes(d.dataset.blocco!);
      requestAnimationFrame(() => {
        const s = scroller();
        if (s) s.scrollTop = m.scroll;
        else window.scrollTo(0, m.scroll);
      });
    } else salva();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const suScroll = () => { clearTimeout(timer); timer = setTimeout(salva, 150); };
    const target: HTMLElement | Window = scroller() ?? window;
    document.addEventListener("toggle", salva, true);
    target.addEventListener("scroll", suScroll, { passive: true });
    // Prima di aprire una scheda fisso lo scroll esatto.
    document.addEventListener("click", salva, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("toggle", salva, true);
      document.removeEventListener("click", salva, true);
      target.removeEventListener("scroll", suScroll);
    };
  }, [base]);

  return <span ref={ref} hidden />;
}

/** Link "indietro" verso un elenco: torna all'ultima versione vista (filtri, ricerca), non a quella vuota. */
export function LinkElenco({ base, className, children, ...resto }: { base: string; className?: string; children: React.ReactNode; "aria-label"?: string }) {
  const router = useRouter();
  const vai = (e: React.MouseEvent) => {
    const url = leggi(base)?.url;
    if (!url || url === base || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    router.push(url);
  };
  return <Link href={base} onClick={vai} className={className} {...resto}>{children}</Link>;
}
