"use client";

import FotoRitagliabile from "@/components/mobile/FotoRitagliabile";
import ColoriTessutoEditor from "@/components/materiali/ColoriTessutoEditor";
import type { VoceColore } from "@/lib/colori";

/** Colori del tessuto: codici della cartella, foto della cartella (il riferimento vero) e la sua data. */
export default function SezioneColori(p: {
  fornitore: string;
  codici: string[];
  onCodici: (c: string[]) => void;
  voci: VoceColore[];
  onVoce: (v: VoceColore) => void;
  cartellaFoto: string;
  onCartellaFoto: (url: string) => void;
  cartellaData: string;
  onCartellaData: (d: string) => void;
}) {
  return (
    <div className="space-y-4">
      <ColoriTessutoEditor fornitore={p.fornitore} codici={p.codici} onChange={p.onCodici} voci={p.voci} onVoce={p.onVoce} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] items-start">
        <div>
          <div className="text-[13px] text-[#4A5566] mb-1.5">Foto della cartella colori</div>
          <FotoRitagliabile value={p.cartellaFoto} onChange={p.onCartellaFoto} etichetta="Foto della cartella" alt="Cartella colori" />
        </div>
        <label className="block">
          <span className="text-[13px] text-[#4A5566]">Data cartella</span>
          <input value={p.cartellaData} onChange={(e) => p.onCartellaData(e.target.value)} placeholder="es. 06/26"
            className="mt-1.5 w-full h-12 px-3 border border-[#D6D1C4] rounded-[10px] bg-white font-mono text-[15px] focus:border-[#1F3A68] outline-none" />
        </label>
      </div>
    </div>
  );
}
