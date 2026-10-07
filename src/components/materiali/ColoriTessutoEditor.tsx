"use client";

import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { PALETTE_COLORI } from "@/components/ui/ColorPickerNamed";
import { chiaveFornitore, coloriTessuto, dizionarioFornitore, parseCodici, type NomiTessuto, type VoceColore } from "@/lib/colori";

/** Pallino del colore; senza colore assegnato è tratteggiato. */
export function Pallino({ hex, size = 18 }: { hex: string | null; size?: number }) {
  return (
    <span aria-hidden className={`inline-block rounded-full flex-shrink-0 border ${hex ? "border-black/15" : "border-dashed border-[#9AA3B2]"}`}
      style={{ width: size, height: size, backgroundColor: hex ?? "transparent" }} />
  );
}

/**
 * Codici colore di un tessuto, scritti come sulla cartella del fornitore ("99, 100, 02").
 * Il nome di ogni codice vale per tutto il fornitore: lo si dà una volta e compare su tutti i suoi tessuti.
 */
export default function ColoriTessutoEditor({ fornitore, codici, onChange, voci, onVoce, nomi, onNomi }: {
  fornitore: string;
  codici: string[];
  onChange: (codici: string[]) => void;
  voci: VoceColore[];
  onVoce: (voce: VoceColore) => void;
  /** Nomi validi solo per questo tessuto (si salvano col materiale). */
  nomi: NomiTessuto;
  onNomi: (nomi: NomiTessuto) => void;
}) {
  const [nuovi, setNuovi] = useState("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [hex, setHex] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [soloQui, setSoloQui] = useState(false);

  const colori = coloriTessuto(codici, dizionarioFornitore(voci, fornitore), nomi);
  const fornitoreK = chiaveFornitore(fornitore);
  const senzaNome = colori.filter((c) => !c.nome).length;

  const aggiungi = () => {
    const extra = parseCodici(nuovi);
    if (extra.length) onChange([...codici, ...extra.filter((c) => !codici.includes(c))]);
    setNuovi("");
  };

  const apri = (codice: string) => {
    const c = colori.find((x) => x.codice === codice);
    setErrore(null);
    setAperto(aperto === codice ? null : codice);
    setNome(c?.nome ?? "");
    setHex(c?.hex ?? null);
    setSoloQui(!!c?.soloQui);
  };

  // Torna al nome del fornitore: il codice non ha più un nome proprio in questo tessuto.
  const usaNomeFornitore = (codice: string) => {
    const resto = { ...nomi };
    delete resto[codice];
    onNomi(resto);
    setAperto(null);
  };

  const salvaNome = async () => {
    if (!aperto || !nome.trim()) return;
    if (soloQui) {
      onNomi({ ...nomi, [aperto]: { nome: nome.trim(), hex } });
      setAperto(null);
      return;
    }
    if (nomi[aperto]) usaNomeFornitore(aperto);
    if (!fornitoreK) { setErrore("Indica prima il fornitore: il nome vale per tutti i suoi tessuti"); return; }
    setSalvando(true);
    const res = await fetch("/api/colori-fornitore", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fornitore, codice: aperto, nome: nome.trim(), hex }),
    });
    setSalvando(false);
    if (!res.ok) { setErrore((await res.json().catch(() => null))?.error || "Nome non salvato"); return; }
    onVoce(await res.json());
    setAperto(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-[#4A5566]">Colori disponibili</span>
        {colori.length > 0 && (
          <span className="text-xs text-[#5F6878]">
            {colori.length} {colori.length === 1 ? "colore" : "colori"}{senzaNome > 0 && ` · ${senzaNome} senza nome`}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input value={nuovi} onChange={(e) => setNuovi(e.target.value)} inputMode="text" autoCapitalize="characters"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aggiungi(); } }}
          placeholder="es. 99, 100, 02" aria-label="Codici colore da aggiungere"
          className="flex-1 min-w-0 h-12 px-3 border border-[#D6D1C4] rounded-[10px] bg-white font-mono text-[15px] focus:border-[#1F3A68] outline-none" />
        <button type="button" onClick={aggiungi} disabled={!nuovi.trim()}
          className="h-12 px-4 rounded-[10px] bg-[#0E1B2C] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
          <Plus size={16} /> Aggiungi
        </button>
      </div>

      {colori.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {colori.map((c) => (
            <li key={c.codice}
              className={`flex items-center rounded-full border bg-white ${aperto === c.codice ? "border-[#1F3A68] ring-2 ring-[#1F3A68]/15" : c.nome ? "border-[#D6D1C4]" : "border-dashed border-[#C9A27A]"}`}>
              <button type="button" onClick={() => apri(c.codice)} aria-expanded={aperto === c.codice}
                className="h-10 pl-2.5 pr-1.5 flex items-center gap-2 text-[14px]">
                <Pallino hex={c.hex} />
                <span className="font-mono font-semibold">{c.codice}</span>
                <span className={c.nome ? "text-[#0E1B2C]" : "text-[#A8461F] text-[13px]"}>{c.nome ?? "dai un nome"}</span>
                {c.soloQui && <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1F3A68] bg-[#E3E9F3] rounded px-1.5 py-0.5">solo qui</span>}
              </button>
              <button type="button" onClick={() => onChange(codici.filter((x) => x !== c.codice))} aria-label={`Togli il colore ${c.codice}`}
                className="w-9 h-10 flex items-center justify-center text-[#5F6878] hover:text-[#A8461F]"><X size={15} /></button>
            </li>
          ))}
        </ul>
      )}

      {aperto && (
        <div className="rounded-xl border border-[#E4E0D6] bg-[#FBFAF7] p-3 space-y-3">
          <div className="text-[13px] text-[#4A5566]">
            Nome del colore <span className="font-mono font-semibold text-[#0E1B2C]">{aperto}</span>
          </div>
          {/* Di norma un codice è lo stesso colore su tutti i tessuti del fornitore; quando non è così vale solo qui. */}
          <div role="group" aria-label="Il nome vale per" className="flex bg-[#EEEBE3] rounded-xl p-1 text-[13px]">
            {[{ v: false, l: fornitoreK ? `Tutti i tessuti ${fornitoreK}` : "Tutto il fornitore" }, { v: true, l: "Solo questo tessuto" }].map((o) => (
              <button key={String(o.v)} type="button" aria-pressed={soloQui === o.v} onClick={() => setSoloQui(o.v)}
                className={`flex-1 h-9 rounded-lg ${soloQui === o.v ? "bg-white font-semibold shadow-[0_1px_2px_rgba(14,27,44,0.12)]" : "text-[#4A5566]"}`}>
                {o.l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {PALETTE_COLORI.map((p) => (
              <button key={p.nome} type="button" title={p.nome} aria-label={p.nome}
                onClick={() => { setNome(p.nome); setHex(p.hex); }}
                className={`h-9 rounded-lg flex items-center justify-center ${hex === p.hex ? "ring-2 ring-[#1F3A68]" : ""}`}>
                <Pallino hex={p.hex} size={24} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="es. Blu scuro" aria-label="Nome del colore"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvaNome(); } }}
              className="flex-1 min-w-0 h-11 px-3 border border-[#D6D1C4] rounded-[10px] bg-white text-[15px] focus:border-[#1F3A68] outline-none" />
            <button type="button" onClick={salvaNome} disabled={salvando || !nome.trim()}
              className="h-11 px-4 rounded-[10px] bg-[#0E1B2C] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
              <Check size={16} /> Salva
            </button>
          </div>
          {nomi[aperto] && (
            <button type="button" onClick={() => usaNomeFornitore(aperto)} className="text-[13px] text-[#1F3A68] underline underline-offset-2">
              Usa il nome {fornitoreK || "del fornitore"}
            </button>
          )}
          {soloQui && <p className="text-xs text-[#5F6878]">Si salva insieme al materiale.</p>}
          {errore && <p role="alert" className="text-sm text-red-800">{errore}</p>}
        </div>
      )}
    </div>
  );
}
