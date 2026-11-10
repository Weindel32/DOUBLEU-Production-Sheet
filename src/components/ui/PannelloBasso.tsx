"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** Oltre questa distanza (px) il pannello trascinato in basso si chiude. */
const SOGLIA_CHIUSURA = 90;

/**
 * Pannello dal basso del telefono: sale con un'animazione, blocca lo scroll della pagina dietro
 * e si chiude toccando fuori, con la X o trascinando in giù la parte alta.
 */
export default function PannelloBasso({ titolo, onChiudi, chiudi: chiudiDaFuori = false, children }: {
  titolo: string;
  /** Chiamata a uscita finita, comunque sia stato chiuso. */
  onChiudi: () => void;
  /** Messo a true da chi lo usa (es. dopo un pulsante al suo interno) fa uscire il pannello. */
  chiudi?: boolean;
  children: React.ReactNode;
}) {
  const [trascina, setTrascina] = useState<{ da: number; y: number } | null>(null);
  const [chiuso, setChiuso] = useState(false);
  const uscita = chiuso || chiudiDaFuori;
  const [entrato, setEntrato] = useState(false);

  useEffect(() => {
    // Su iOS overflow:hidden non basta: si fissa il body e al termine si torna allo stesso punto.
    const y = window.scrollY;
    const { style } = document.body;
    const prima = { position: style.position, top: style.top, width: style.width };
    style.position = "fixed";
    style.top = `-${y}px`;
    style.width = "100%";
    return () => {
      style.position = prima.position;
      style.top = prima.top;
      style.width = prima.width;
      window.scrollTo(0, y);
    };
  }, []);

  const chiudi = () => setChiuso(true);
  const giu = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTrascina({ da: e.clientY, y: 0 });
  };
  const muovi = (e: React.PointerEvent) => trascina && !uscita && setTrascina({ da: trascina.da, y: Math.max(0, e.clientY - trascina.da) });
  const su = () => {
    if (!trascina || uscita) return;
    // Oltre la soglia esce da dove l'ha lasciato il dito; sotto, torna su.
    if (trascina.y > SOGLIA_CHIUSURA) chiudi();
    else setTrascina(null);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* pointerup oltre al click: dopo un trascinamento il primo tocco può non generare il click. */}
      <div onClick={chiudi} onPointerUp={chiudi} className={`absolute inset-0 bg-[#0E1B2C]/30 ${uscita ? "pannello-velo-esce" : "pannello-velo"}`} />
      <div role="dialog" aria-modal="true" aria-label={titolo}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          if (uscita) onChiudi();
          else setEntrato(true);
        }}
        style={trascina ? { transform: `translateY(${trascina.y}px)` } : undefined}
        className={`absolute inset-x-0 bottom-0 max-h-[90dvh] flex flex-col bg-white rounded-t-2xl shadow-xl ${
          uscita ? "pannello-esce" : !entrato ? "pannello-basso" : trascina ? "" : "transition-transform duration-200"}`}>
        <div onPointerDown={giu} onPointerMove={muovi} onPointerUp={su} onPointerCancel={su}
          className="flex-shrink-0 touch-none select-none px-4 pt-2.5 pb-1">
          <span aria-hidden className="block w-10 h-1.5 rounded-full bg-[#D6D1C4] mx-auto mb-1.5" />
          <div className="flex items-center justify-between px-2">
            <span className="font-display font-bold text-[17px] text-[#0E1B2C]">{titolo}</span>
            <button type="button" onClick={chiudi} aria-label="Chiudi"
              className="w-11 h-11 -mr-2.5 rounded-lg flex items-center justify-center text-[#5F6878] active:bg-[#0E1B2C]/5">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
