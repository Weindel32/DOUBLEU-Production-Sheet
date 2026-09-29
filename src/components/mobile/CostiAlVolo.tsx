"use client";

import { useState } from "react";
import { Search, ChevronDown, Shirt } from "lucide-react";
import { formatEuro, prezzoDaMargine, parseNumIt } from "@/lib/utils";

export interface ArticoloCosto {
  id: string;
  nome: string;
  codice: string;
  categoria: string | null;
  foto: string | null;
  materiali: number;
  accessori: number;
  lavorazioni: number;
  costo: number;
  prezzo: number;
  margine: number | null;
}

const MARGINI = [35, 45, 55];

const pct = (m: number | null) => (m === null ? "—" : `${m.toFixed(1).replace(".", ",")}%`);
const coloreMargine = (m: number | null) =>
  m === null ? "text-[#5F6878]" : m >= 40 ? "text-[#1D6B4A]" : m >= 30 ? "text-[#7A5B12]" : "text-[#A8461F]";

/** Sola lettura: costo per capo, prezzo e margine, più "che margine faccio a questo prezzo?". */
export default function CostiAlVolo({ articoli }: { articoli: ArticoloCosto[] }) {
  const [q, setQ] = useState("");
  const [aperto, setAperto] = useState<string | null>(null);
  const [prezzoProva, setPrezzoProva] = useState("");
  const f = q.trim().toLowerCase();
  const visibili = f
    ? articoli.filter((a) => [a.nome, a.codice, a.categoria].some((v) => v?.toLowerCase().includes(f)))
    : articoli;

  return (
    <div className="px-4 space-y-3">
      <label className="h-12 bg-white border border-[#D6D1C4] rounded-xl flex items-center gap-2.5 px-3.5 text-[#5F6878] focus-within:border-[#1F3A68]">
        <Search size={18} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca articolo o codice"
          aria-label="Cerca articoli" className="flex-1 min-w-0 border-0 !shadow-none bg-transparent p-0 text-base" />
      </label>

      {visibili.length === 0 && <p className="text-center text-[#5F6878] py-8">Nessun articolo di costo.</p>}

      {visibili.map((a) => {
        const on = aperto === a.id;
        const prova = on ? parseNumIt(prezzoProva) : null;
        const margineProva = prova && prova > 0 && a.costo > 0 ? ((prova - a.costo) / prova) * 100 : null;
        return (
          <div key={a.id} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
            <button type="button" aria-expanded={on} onClick={() => { setAperto(on ? null : a.id); setPrezzoProva(""); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-[#FBFAF7]">
              <span className="w-12 h-12 rounded-xl bg-[#EEEBE3] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#5F6878]">
                {a.foto ? <img src={a.foto} alt="" className="w-full h-full object-cover" /> : <Shirt size={20} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{a.nome}</span>
                <span className="block text-[13px] text-[#5F6878] truncate font-mono">{a.codice}</span>
              </span>
              <span className="text-right flex-shrink-0">
                <span className="block font-mono font-semibold">{a.costo > 0 ? formatEuro(a.costo) : "—"}</span>
                <span className={`block text-xs font-mono font-semibold ${coloreMargine(a.margine)}`}>{pct(a.margine)}</span>
              </span>
              <ChevronDown size={18} className={`text-[#C9C3B5] flex-shrink-0 transition-transform ${on ? "rotate-180" : ""}`} />
            </button>

            {on && (
              <div className="border-t border-[#EFEBE2] p-4 space-y-4">
                <div className="bg-[#0E1B2C] text-white rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-wider text-[#B7C4D8]">Costo per capo</span>
                    <span className="font-mono text-2xl font-semibold">{formatEuro(a.costo)}</span>
                  </div>
                  {[["Materiali", a.materiali], ["Accessori", a.accessori], ["Lavorazioni", a.lavorazioni]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-sm text-[#B7C4D8]">
                      <span>{l}</span><span className="font-mono">{formatEuro(v as number)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-white/15 pt-2">
                    <span className="text-[#B7C4D8]">Prezzo di listino</span>
                    <span className="font-mono">{a.prezzo > 0 ? formatEuro(a.prezzo) : "—"} · {pct(a.margine)}</span>
                  </div>
                </div>

                {a.costo > 0 && (
                  <>
                    <div>
                      <div className="text-[13px] text-[#4A5566] mb-2">Prezzo per avere un margine del</div>
                      <div className="grid grid-cols-3 gap-2">
                        {MARGINI.map((m) => (
                          <div key={m} className="rounded-xl bg-[#F6F4EF] py-2.5 text-center">
                            <div className="text-xs text-[#5F6878]">{m}%</div>
                            <div className="font-mono font-semibold">{formatEuro(prezzoDaMargine(a.costo, m))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <label className="block">
                      <span className="text-[13px] text-[#4A5566]">Se lo vendo a…</span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="flex-1 flex items-center gap-1.5 h-12 border border-[#D6D1C4] rounded-[10px] bg-white px-3 focus-within:border-[#1F3A68]">
                          <span className="text-[#5F6878]">€</span>
                          <input inputMode="decimal" value={prezzoProva} onChange={(e) => setPrezzoProva(e.target.value)} placeholder="0,00"
                            className="w-full min-w-0 border-0 !shadow-none bg-transparent p-0 text-right font-mono text-lg" />
                        </span>
                        <span className={`w-24 text-right font-mono text-xl font-semibold ${coloreMargine(margineProva)}`}>{pct(margineProva)}</span>
                      </span>
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
