"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, Loader2, Share } from "lucide-react";

/**
 * PDF da stampare o inviare. Su telefono apre il foglio di condivisione di iOS/Android col file allegato
 * (Stampa, WhatsApp, Mail, Salva su File); al computer lo scarica.
 * Il file si prepara appena il pulsante compare: iOS apre la condivisione solo se il tocco la chiama
 * subito, senza aspettare il server.
 */
export default function PulsantePdf({ url, nomeFile, etichetta, className, variante = "pieno" }: {
  url: string;
  nomeFile: string;
  etichetta: string;
  className?: string;
  variante?: "pieno" | "bordo";
}) {
  const [file, setFile] = useState<File | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const richiesto = useRef(false);

  useEffect(() => {
    if (richiesto.current) return;
    richiesto.current = true;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || "PDF non disponibile");
        return r.blob();
      })
      .then((b) => {
        setMobile(window.matchMedia("(pointer: coarse)").matches);
        setFile(new File([b], nomeFile, { type: "application/pdf" }));
      })
      .catch((e: Error) => setErrore(e.message));
  }, [url, nomeFile]);

  const scarica = (f: File) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(f);
    link.download = f.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  };

  const apri = async () => {
    if (!file) return;
    if (mobile && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: file.name.replace(/\.pdf$/, "") });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // chiuso dall'utente
      }
    }
    // Ripiego: il PDF nel visualizzatore del telefono (ha Condividi e Stampa) o lo scaricamento al computer.
    if (mobile) window.location.href = url;
    else scarica(file);
  };

  const stile = variante === "pieno"
    ? "bg-[#0E1B2C] text-white active:bg-[#1F3A68] hover:bg-[#1F3A68]"
    : "border border-[#D6D1C4] bg-white text-[#0E1B2C] active:bg-[#FBFAF7] hover:border-[#0E1B2C]/40";
  return (
    <div className={className}>
      <button type="button" onClick={apri} disabled={!file}
        className={`w-full h-12 px-5 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${stile}`}>
        {!file && !errore ? <Loader2 size={18} className="animate-spin" /> : mobile ? <Share size={18} /> : <FileDown size={18} />}
        {!file && !errore ? "Preparo il PDF…" : etichetta}
      </button>
      {errore && <p role="alert" className="text-xs text-[#A8461F] mt-1 text-center">{errore}</p>}
    </div>
  );
}
