"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X, Check } from "lucide-react";
import type { Campione, VoceCampione } from "@/types";
import { VOCI_CAMPIONE, parseNumIt, formatEuro, totaleCampione, totaleSviluppo } from "@/lib/utils";
import { caricaImmagine } from "@/lib/immagini";
import { Field, ChipGroup, EuroInput, inputCls } from "@/components/ui/Form";

const NUOVO = "__nuovo__";
const oggi = () => new Date().toISOString().slice(0, 10);
const dataIt = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join("/") : d);

/**
 * Registra una spesa di sviluppo (taglio, cartamodello, confezione…) su un campione dell'articolo,
 * anche nuovo. Resta separata dal costo per capo, come nella scheda.
 */
export default function SpesaCampioneForm({ schedaId, campioniIniziali }: { schedaId: string; campioniIniziali: Campione[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [campioni, setCampioni] = useState(campioniIniziali);
  const [scelto, setScelto] = useState(campioniIniziali.at(-1)?.id ?? NUOVO);
  const [voce, setVoce] = useState("");
  const [importo, setImporto] = useState("");
  const [foto, setFoto] = useState("");
  const [caricando, setCaricando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [fatto, setFatto] = useState<string | null>(null);

  const campione = campioni.find((c) => c.id === scelto);
  const importoNum = parseNumIt(importo);

  const scattaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCaricando(true);
    setErrore(null);
    try { setFoto(await caricaImmagine(file)); }
    catch (err) { setErrore(err instanceof Error ? err.message : "Foto non caricata"); }
    finally { setCaricando(false); }
  };

  const registra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voce.trim() || importoNum === null) return;
    setSalvando(true);
    setErrore(null);
    const nuovaVoce: VoceCampione = { descrizione: voce.trim(), importo: importoNum, ...(foto ? { foto } : {}) };
    let lista: Campione[];
    let idCampione = scelto;
    if (scelto === NUOVO) {
      idCampione = Math.random().toString(36).slice(2, 10);
      lista = [...campioni, { id: idCampione, nome: `${campioni.length + 1}° campione`, data: oggi(), voci: [nuovaVoce] }];
    } else {
      lista = campioni.map((c) => (c.id === scelto ? { ...c, voci: [...c.voci, nuovaVoce] } : c));
    }
    const res = await fetch(`/api/schede/${schedaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campioni: lista }),
    });
    setSalvando(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErrore(b.error || "Spesa non registrata");
      return;
    }
    setCampioni(lista);
    setScelto(idCampione);
    setFatto(`${nuovaVoce.descrizione} ${formatEuro(nuovaVoce.importo)} registrato.`);
    setVoce("");
    setImporto("");
    setFoto("");
  };

  const opzioniCampione = [
    ...campioni.map((c) => ({ id: c.id, label: `${c.nome} · ${dataIt(c.data)}`, totale: totaleCampione(c) })),
    { id: NUOVO, label: campioni.length === 0 ? "Primo campione" : "Nuovo campione", totale: null },
  ];

  return (
    <form onSubmit={registra} className="px-4 space-y-4 pb-6">
      {fatto && (
        <p role="status" className="flex items-center gap-2 text-sm text-[#1D6B4A] bg-[#DDEFE5] rounded-xl px-4 py-3">
          <Check size={18} /> <span>{fatto}{" "}Puoi aggiungerne un&apos;altra.</span>
        </p>
      )}

      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-2">
        <div className="text-[13px] text-[#4A5566]">Campione</div>
        <div role="group" aria-label="Campione" className="flex flex-col gap-2">
          {opzioniCampione.map((o) => {
            const on = o.id === scelto;
            return (
              <button key={o.id} type="button" aria-pressed={on} onClick={() => setScelto(o.id)}
                className={`h-12 px-4 rounded-xl border flex items-center justify-between text-[15px] ${on ? "bg-[#0E1B2C] border-[#0E1B2C] text-white font-semibold" : "bg-white border-[#D6D1C4] text-[#0E1B2C]"}`}>
                <span>{o.label}</span>
                {o.totale !== null && <span className="font-mono text-sm">{formatEuro(o.totale)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-4">
        <ChipGroup label="Voce" options={VOCI_CAMPIONE} value={voce} onChange={setVoce} />
        <Field label="…oppure scrivila">
          <input value={VOCI_CAMPIONE.includes(voce) ? "" : voce} onChange={(e) => setVoce(e.target.value)}
            placeholder="es. Modifica manica" className={`${inputCls} h-12`} />
        </Field>
        <div className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
          <span>Importo</span>
          <EuroInput big label="Importo della spesa" value={importo} onChange={setImporto} onBlur={() => {}} />
        </div>
        {foto ? (
          <div className="relative">
            <img src={foto} alt="Scontrino" className="w-full h-40 object-cover rounded-xl bg-[#EEEBE3]" />
            <button type="button" onClick={() => setFoto("")} aria-label="Togli la foto"
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center"><X size={18} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={caricando}
            className="w-full h-12 rounded-xl border border-dashed border-[#C9C3B5] text-[#1F3A68] text-sm font-semibold flex items-center justify-center gap-2">
            {caricando ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            Foto dello scontrino (facoltativa)
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scattaFoto} />
      </div>

      {errore && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{errore}</p>}

      <button type="submit" disabled={salvando || caricando || !voce.trim() || importoNum === null}
        className="w-full h-14 rounded-2xl bg-[#0E1B2C] text-white text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        {salvando && <Loader2 size={18} className="animate-spin" />}
        Registra spesa
      </button>

      {campione && campione.voci.length > 0 && (
        <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4">
          <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#5F6878] mb-2">
            <span>{campione.nome}</span><span>{formatEuro(totaleCampione(campione))}</span>
          </div>
          <ul className="text-[15px] divide-y divide-[#EFEBE2]">
            {campione.voci.map((v, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>{v.descrizione}{v.foto && <a href={v.foto} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[#1F3A68] underline">foto</a>}</span>
                <span className="font-mono">{formatEuro(v.importo)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {campioni.length > 1 && (
        <p className="text-center text-[13px] text-[#5F6878]">Sviluppo totale dell&apos;articolo: <span className="font-mono">{formatEuro(totaleSviluppo(campioni))}</span></p>
      )}
    </form>
  );
}
