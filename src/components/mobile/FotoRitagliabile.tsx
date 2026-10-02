"use client";

import { useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, Crop, Loader2, X, RefreshCw } from "lucide-react";
import { caricaImmagine, urlPerRitaglio, ritaglia } from "@/lib/immagini";

const AREA_INIZIALE: PercentCrop = { unit: "%", x: 8, y: 20, width: 84, height: 60 };

/**
 * Foto con ritaglio prima del caricamento: si tiene solo il cartellino (o lo scontrino),
 * così l'immagine salvata è piccola, leggibile e non invade la scheda.
 */
export default function FotoRitagliabile({ value, onChange, etichetta, alt }: {
  value: string;
  onChange: (url: string) => void;
  etichetta: string;
  alt: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [sorgente, setSorgente] = useState<string | null>(null);
  const [area, setArea] = useState<PercentCrop>(AREA_INIZIALE);
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const apri = async (blob: Blob) => {
    setErrore(null);
    setArea(AREA_INIZIALE);
    setSorgente(await urlPerRitaglio(blob));
  };

  const chiudi = () => {
    if (sorgente) URL.revokeObjectURL(sorgente);
    setSorgente(null);
  };

  const scegli = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await apri(file);
  };

  // Per ritagliare una foto già salvata la riscarico passando dal server (lo storage non è sullo stesso dominio).
  const ritagliaSalvata = async () => {
    try {
      const res = await fetch(value.startsWith("http") ? `/api/foto?url=${encodeURIComponent(value)}` : value);
      if (!res.ok) throw new Error();
      await apri(await res.blob());
    } catch {
      setErrore("Non riesco a riaprire questa foto: scattala di nuovo");
    }
  };

  const conferma = async (intera: boolean) => {
    const img = imgRef.current;
    if (!img) return;
    setCaricando(true);
    setErrore(null);
    try {
      const file = await ritaglia(img, intera || !area.width || !area.height ? { x: 0, y: 0, width: 100, height: 100 } : area);
      onChange(await caricaImmagine(file));
      chiudi();
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Foto non caricata");
    } finally {
      setCaricando(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="space-y-2">
          <a href={value} target="_blank" rel="noreferrer" aria-label="Apri la foto a tutto schermo" className="block">
            <img src={value} alt={alt} className="mx-auto max-h-48 w-auto max-w-full object-contain rounded-xl bg-[#EEEBE3]" />
          </a>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={ritagliaSalvata}
              className="h-10 px-3 rounded-lg border border-[#D6D1C4] text-[13px] font-medium inline-flex items-center gap-1.5"><Crop size={15} /> Ritaglia</button>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="h-10 px-3 rounded-lg border border-[#D6D1C4] text-[13px] font-medium inline-flex items-center gap-1.5"><RefreshCw size={15} /> Cambia</button>
            <button type="button" onClick={() => onChange("")} aria-label="Togli la foto"
              className="h-10 px-3 rounded-lg border border-[#D6D1C4] text-[13px] font-medium inline-flex items-center gap-1.5 text-[#A8461F]"><X size={15} /> Togli</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-[#C9C3B5] bg-[#FBFAF7] text-[#1F3A68] flex flex-col items-center justify-center gap-1.5 font-semibold">
          <Camera size={24} /> {etichetta}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scegli} />
      {errore && !sorgente && <p role="alert" className="mt-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{errore}</p>}

      {sorgente && (
        <div role="dialog" aria-label="Ritaglia la foto" className="fixed inset-0 z-[60] bg-[#0E1B2C] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <p className="text-center text-white/80 text-sm px-4 py-3">Trascina gli angoli sul cartellino</p>
          <div className="flex-1 min-h-0 flex items-center justify-center px-3">
            {/* L'altezza massima va sul contenitore: il CSS del ritaglio la fa ereditare all'immagine. */}
            <ReactCrop crop={area} onChange={(_, pct) => setArea(pct)} keepSelection ruleOfThirds style={{ maxHeight: "68vh" }}>
              <img ref={imgRef} src={sorgente} alt="Foto da ritagliare" />
            </ReactCrop>
          </div>
          {errore && <p role="alert" className="mx-4 mb-2 text-sm text-red-100 bg-red-900/60 rounded-[10px] px-3 py-2">{errore}</p>}
          <div className="grid grid-cols-3 gap-2 p-3">
            <button type="button" onClick={chiudi} disabled={caricando}
              className="h-12 rounded-xl text-white/90 text-[15px] font-medium">Annulla</button>
            <button type="button" onClick={() => conferma(true)} disabled={caricando}
              className="h-12 rounded-xl border border-white/30 text-white text-[15px] font-medium">Foto intera</button>
            <button type="button" onClick={() => conferma(false)} disabled={caricando}
              className="h-12 rounded-xl bg-white text-[#0E1B2C] text-[15px] font-semibold inline-flex items-center justify-center gap-1.5">
              {caricando ? <Loader2 size={18} className="animate-spin" /> : <Crop size={17} />} Usa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
