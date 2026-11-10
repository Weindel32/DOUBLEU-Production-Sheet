"use client";

import { useState } from "react";
import Image from "next/image";

/** Le foto caricate dall'app stanno su Vercel Blob: solo quelle passano dall'ottimizzazione. */
function suBlob(src: string) {
  try { return new URL(src).hostname.endsWith(".public.blob.vercel-storage.com"); } catch { return false; }
}

/**
 * Foto ridotta alla misura in cui si vede (elenchi, galleria): invece dell'originale fino a 2400px
 * il telefono scarica una versione piccola in WebP. Se la versione ridotta non arriva
 * (formato non gestito, indirizzo esterno) si mostra l'originale, come prima.
 */
export default function Miniatura({ src, alt = "", lato, className, subito = false }: {
  src: string;
  alt?: string;
  /** Lato in px a cui la foto viene mostrata. */
  lato: number;
  className?: string;
  /** Prima foto in vista: si carica senza aspettare lo scroll. */
  subito?: boolean;
}) {
  const [originale, setOriginale] = useState(false);
  const comuni = { alt, className, loading: subito ? "eager" : "lazy", decoding: "async" } as const;
  if (originale || !suBlob(src))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={lato} height={lato} {...comuni} />;
  // Una volta e mezza il lato: con il 2x del srcset resta nitida anche sugli schermi 3x.
  const px = Math.round(lato * 1.5);
  return <Image src={src} width={px} height={px} onError={() => setOriginale(true)} {...comuni} />;
}
