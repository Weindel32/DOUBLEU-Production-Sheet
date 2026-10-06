"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { PALETTE_COLORI } from "@/components/ui/ColorPickerNamed";
import { Pallino } from "@/components/materiali/ColoriTessutoEditor";

export interface RigaColore {
  id: string | null;
  fornitore: string;
  codice: string;
  nome: string | null;
  hex: string | null;
  tessuti: string[];
}

export default function ColoriFornitoriClient({ righe }: { righe: RigaColore[] }) {
  const router = useRouter();
  const [aperta, setAperta] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [hex, setHex] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  const fornitori = [...new Set(righe.map((r) => r.fornitore))];
  const k = (r: RigaColore) => `${r.fornitore}|${r.codice}`;

  const apri = (r: RigaColore) => {
    setErrore(null);
    setAperta(aperta === k(r) ? null : k(r));
    setNome(r.nome ?? "");
    setHex(r.hex);
  };

  const salva = async (r: RigaColore) => {
    if (!nome.trim()) return;
    const res = await fetch("/api/colori-fornitore", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fornitore: r.fornitore, codice: r.codice, nome: nome.trim(), hex }),
    });
    if (!res.ok) { setErrore((await res.json().catch(() => null))?.error || "Non salvato"); return; }
    setAperta(null);
    router.refresh();
  };

  const elimina = async (r: RigaColore) => {
    if (!r.id || !confirm(`Togliere il nome del colore ${r.fornitore} ${r.codice}? Il codice resta nei tessuti, senza nome.`)) return;
    await fetch(`/api/colori-fornitore?id=${r.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl">
      <Link href="/materiali" className="inline-flex items-center gap-2 text-sm text-[#4A5566] hover:text-[#0E1B2C]">
        <ArrowLeft size={16} /> Materiali
      </Link>
      <div>
        <h1 className="font-display text-[34px] font-extrabold tracking-tight text-[#0E1B2C] leading-tight">Colori fornitori</h1>
        <p className="text-sm text-[#5F6878] mt-1">
          Il nome di un codice vale per tutti i tessuti dello stesso fornitore. I codici si aggiungono dal singolo tessuto.
        </p>
      </div>

      {righe.length === 0 && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl text-center py-14 text-[#5F6878]">
          Nessun colore ancora: aggiungi i codici della cartella in un tessuto.
        </div>
      )}

      {fornitori.map((f) => {
        const mie = righe.filter((r) => r.fornitore === f);
        const senzaNome = mie.filter((r) => !r.nome).length;
        return (
          <section key={f} className="bg-white border border-[#E4E0D6] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E4E0D6] bg-[#FBFAF7] flex items-baseline justify-between">
              <h2 className="font-display text-[17px] font-bold text-[#0E1B2C]">{f}</h2>
              <span className="text-xs text-[#5F6878]">{mie.length} codici{senzaNome > 0 && ` · ${senzaNome} senza nome`}</span>
            </div>
            <ul>
              {mie.map((r) => (
                <li key={k(r)} className="border-b border-[#EFEBE2] last:border-0">
                  <div className="flex items-center gap-3 px-5 py-2.5">
                    <Pallino hex={r.hex} size={22} />
                    <span className="font-mono font-semibold w-14">{r.codice}</span>
                    <button type="button" onClick={() => apri(r)} className={`flex-1 text-left text-[15px] ${r.nome ? "text-[#0E1B2C]" : "text-[#A8461F]"}`}>
                      {r.nome ?? "dai un nome"}
                    </button>
                    <span className="text-xs text-[#5F6878] hidden sm:block max-w-[40%] truncate" title={r.tessuti.join(", ")}>
                      {r.tessuti.length ? r.tessuti.join(", ") : "in nessun tessuto"}
                    </span>
                    {r.id && (
                      <button type="button" onClick={() => elimina(r)} aria-label={`Togli il nome di ${r.codice}`}
                        className="w-9 h-9 rounded-lg text-[#5F6878] hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center"><Trash2 size={15} /></button>
                    )}
                  </div>
                  {aperta === k(r) && (
                    <div className="px-5 pb-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {PALETTE_COLORI.map((p) => (
                          <button key={p.nome} type="button" title={p.nome} aria-label={p.nome} onClick={() => { setNome(p.nome); setHex(p.hex); }}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${hex === p.hex ? "ring-2 ring-[#1F3A68]" : ""}`}>
                            <Pallino hex={p.hex} size={24} />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 max-w-md">
                        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="es. Blu scuro" aria-label="Nome del colore" autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") salva(r); }}
                          className="flex-1 min-w-0 h-11 px-3 border border-[#D6D1C4] rounded-[10px] bg-white text-[15px] focus:border-[#1F3A68] outline-none" />
                        <button type="button" onClick={() => salva(r)} disabled={!nome.trim()}
                          className="h-11 px-4 rounded-[10px] bg-[#0E1B2C] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
                          <Check size={16} /> Salva
                        </button>
                      </div>
                      {errore && <p role="alert" className="text-sm text-red-800">{errore}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
