"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X, History } from "lucide-react";
import { calcolaCostoMetroDaPrezzoKg, parseNumIt, formatEuro } from "@/lib/utils";
import { caricaImmagine } from "@/lib/immagini";
import { Field, ChipGroup, Segmented, EuroInput, numStr, inputCls, textareaCls } from "@/components/ui/Form";

const TIPI = ["Tessuto", "Fodera", "Elastico", "Cerniera", "Bottoni", "Ricamo", "Stampa", "Altro"];
const UNITA = [{ value: "metro", label: "€ / metro" }, { value: "kg", label: "€ / kg" }, { value: "pz", label: "€ / pezzo" }];
const UNITA_PESO = [{ value: "g/m²", label: "g/m²" }, { value: "g/m", label: "g/m lineare" }];

export interface MaterialeMobile {
  id: string;
  nome: string;
  tipo: string;
  composizione: string | null;
  peso: string | null;
  unitaPeso: string | null;
  larghezza: string | null;
  unitaMisura: string | null;
  fornitore: string | null;
  costoMetro: number | null;
  prezzoKg: number | null;
  codice: string | null;
  note: string | null;
  foto: string | null;
}

/** Nuovo materiale o modifica (soprattutto aggiornamento prezzo) dal telefono, dal fornitore. */
export default function MaterialeMobileForm({ materiale, fornitori, composizioni }: {
  materiale?: MaterialeMobile;
  fornitori: string[];
  composizioni: string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    nome: materiale?.nome ?? "",
    tipo: materiale?.tipo ?? "Tessuto",
    fornitore: materiale?.fornitore ?? "",
    codice: materiale?.codice ?? "",
    composizione: materiale?.composizione ?? "",
    unitaMisura: materiale?.unitaMisura ?? "metro",
    prezzo: numStr(materiale?.unitaMisura === "kg" ? materiale?.prezzoKg : materiale?.costoMetro),
    peso: materiale?.peso ?? "",
    unitaPeso: materiale?.unitaPeso ?? "g/m²",
    larghezza: materiale?.larghezza ?? "",
    notaNuova: "",
    foto: materiale?.foto ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [caricando, setCaricando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const isKg = f.unitaMisura === "kg";
  const isTessuto = f.unitaMisura !== "pz";
  const prezzoNum = parseNumIt(f.prezzo);
  const costoAlMetro = isKg
    ? calcolaCostoMetroDaPrezzoKg({ prezzoKg: prezzoNum, peso: f.peso, unitaPeso: f.unitaPeso, larghezza: f.larghezza })
    : null;
  const prezzoPrima = materiale ? (materiale.unitaMisura === "kg" ? materiale.prezzoKg : materiale.costoMetro) : null;
  const prezzoCambiato = !!materiale && (prezzoNum !== prezzoPrima || f.unitaMisura !== (materiale.unitaMisura ?? "metro"));

  const scattaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCaricando(true);
    setErrore(null);
    try {
      set("foto", await caricaImmagine(file));
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Foto non caricata");
    } finally {
      setCaricando(false);
    }
  };

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErrore(null);
    // La nota scritta ora va in cima a quelle esistenti, con la data.
    const oggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    const note = [f.notaNuova.trim() ? `${oggi} · ${f.notaNuova.trim()}` : "", materiale?.note ?? ""].filter(Boolean).join("\n") || null;
    const payload = {
      nome: f.nome.trim(), tipo: f.tipo, fornitore: f.fornitore.trim() || null, codice: f.codice.trim() || null,
      composizione: f.composizione.trim() || null, unitaMisura: f.unitaMisura,
      peso: isTessuto ? f.peso.trim() || null : null, unitaPeso: isTessuto ? f.unitaPeso : null,
      larghezza: isTessuto ? f.larghezza.trim() || null : null,
      // Stessa convenzione del desktop e del Kit Builder: costoMetro sempre €/m, il prezzo al kg in prezzoKg.
      costoMetro: isKg ? costoAlMetro ?? (materiale?.unitaMisura === "kg" ? materiale.costoMetro : null) : prezzoNum,
      prezzoKg: isKg ? prezzoNum : null,
      foto: f.foto || null,
      note,
    };
    const res = await fetch(materiale ? `/api/materiali/${materiale.id}` : "/api/materiali", {
      method: materiale ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErrore(b.error || "Salvataggio non riuscito");
      setSalvando(false);
      return;
    }
    router.push("/m/materiali?salvato=1");
    router.refresh();
  };

  const storico = (materiale?.note ?? "").split("\n").filter(Boolean);

  return (
    <form onSubmit={salva} className="px-4 space-y-4 pb-6">
      {/* Foto del cartellino / campione */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-3">
        {f.foto ? (
          <div className="relative">
            <img src={f.foto} alt="Foto del materiale" className="w-full h-52 object-cover rounded-xl bg-[#EEEBE3]" />
            <button type="button" onClick={() => set("foto", "")} aria-label="Togli la foto"
              className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/95 shadow flex items-center justify-center"><X size={18} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={caricando}
            className="w-full h-32 rounded-xl border-2 border-dashed border-[#C9C3B5] bg-[#FBFAF7] text-[#1F3A68] flex flex-col items-center justify-center gap-1.5 font-semibold">
            {caricando ? <Loader2 size={24} className="animate-spin" /> : <Camera size={26} />}
            {caricando ? "Caricamento…" : "Foto del cartellino o del campione"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scattaFoto} />
      </div>

      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-4">
        <Field label="Nome *">
          <input required value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="es. Jersey tecnico 160" className={`${inputCls} h-12`} />
        </Field>
        <ChipGroup label="Tipo" options={TIPI} value={f.tipo} onChange={(v) => set("tipo", v || "Tessuto")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fornitore">
            <input list="m-fornitori" value={f.fornitore} onChange={(e) => set("fornitore", e.target.value)} className={`${inputCls} h-12`} />
            <datalist id="m-fornitori">{fornitori.map((x) => <option key={x} value={x} />)}</datalist>
          </Field>
          <Field label="Codice fornitore">
            <input value={f.codice} onChange={(e) => set("codice", e.target.value)} autoCapitalize="characters" className={`${inputCls} h-12 font-mono`} />
          </Field>
        </div>
        <Field label="Composizione">
          <input list="m-composizioni" value={f.composizione} onChange={(e) => set("composizione", e.target.value)} placeholder="es. 60% CO 40% PL" className={`${inputCls} h-12`} />
          <datalist id="m-composizioni">{composizioni.map((x) => <option key={x} value={x} />)}</datalist>
        </Field>
      </div>

      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-4">
        <Segmented label="Prezzo di listino" options={UNITA} value={f.unitaMisura} onChange={(v) => set("unitaMisura", v)} />
        <EuroInput big label="Prezzo" value={f.prezzo} onChange={(v) => set("prezzo", v)} onBlur={() => {}} />
        {prezzoCambiato && prezzoPrima !== null && (
          <p className="text-[13px] text-[#A8461F] bg-[#FBEDE5] rounded-[10px] px-3 py-2">
            Era {formatEuro(prezzoPrima)}: salvando, il cambio viene annotato con la data.
          </p>
        )}
        {isTessuto && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso">
                <input inputMode="decimal" value={f.peso} onChange={(e) => set("peso", e.target.value)} placeholder="es. 280" className={`${inputCls} h-12`} />
              </Field>
              <Field label="Altezza (cm)">
                <input inputMode="decimal" value={f.larghezza} onChange={(e) => set("larghezza", e.target.value)} placeholder="es. 180" className={`${inputCls} h-12`} />
              </Field>
            </div>
            <Segmented options={UNITA_PESO} value={f.unitaPeso} onChange={(v) => set("unitaPeso", v)} />
          </>
        )}
        {isKg && (
          <div className="flex items-center justify-between rounded-[10px] bg-[#EEF2F8] px-4 h-12">
            <span className="text-[13px] text-[#4A5566]">Costo al metro</span>
            <span className="font-mono font-semibold text-[#1F3A68]">
              {costoAlMetro !== null ? `${formatEuro(costoAlMetro)}/m` : "servono peso e altezza"}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-4 space-y-3">
        <Field label={materiale ? "Aggiungi una nota" : "Note"}>
          <textarea rows={2} value={f.notaNuova} onChange={(e) => set("notaNuova", e.target.value)}
            placeholder="es. minimo 50 m, consegna 3 settimane" className={textareaCls} />
        </Field>
        {storico.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5F6878] mb-1.5"><History size={13} /> Storico</div>
            <ul className="text-[13px] text-[#4A5566] space-y-1">{storico.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
      </div>

      {errore && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">{errore}</p>}

      <button type="submit" disabled={salvando || caricando || !f.nome.trim()}
        className="w-full h-14 rounded-2xl bg-[#0E1B2C] text-white text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
        {salvando && <Loader2 size={18} className="animate-spin" />}
        {materiale ? "Salva modifiche" : "Aggiungi materiale"}
      </button>
    </form>
  );
}
