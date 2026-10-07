"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Upload, X, ExternalLink, Loader2, Camera } from "lucide-react";
import { CATEGORIE, parseGrammaturaCommerciale } from "@/lib/utils";
import { Field, ChipGroup, Segmented, SectionCard, inputCls, textareaCls } from "@/components/ui/Form";
import CampoModello, { trovaModello, type ModelloBreve } from "@/components/modelli/CampoModello";
import { fasciaDaGenere } from "@/lib/utils";
import { preparaImmagine } from "@/lib/immagini";
import type { SchedaCompleta } from "@/types";
import SceltaColoreTessuto from "@/components/scheda/SceltaColoreTessuto";
import { coloriTessuto, dizionarioFornitore, leggiCodici, leggiNomiTessuto, type VoceColore } from "@/lib/colori";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  clienti: { id: string; nome: string }[];
  materiali: { id: string; nome: string; tipo: string; costoMetro: number | null; peso: string | null; unitaPeso: string | null; larghezza: string | null; fornitore?: string | null; colori?: string | null; coloriNomi?: string | null }[];
  /** Nomi dei codici colore per fornitore: i colori del tessuto si scelgono da qui. */
  vociColori?: VoceColore[];
  /** Nome, codice e categoria vivono anche nell'intestazione della scheda. */
  onMetaChange?: (meta: { nomeArticolo?: string; codice?: string; categoria?: string; codiceModello?: string }) => void;
  /** Archivio modelli, per suggerire il codice e proporre di aggiungere quelli nuovi. */
  modelli?: ModelloBreve[];
}

const GENERI = ["Unisex", "Uomo", "Donna", "Junior"].map((v) => ({ value: v, label: v }));
const VESTIBILITA = [
  { value: "Regular Fit", label: "Regular" }, { value: "Slim Fit", label: "Slim" },
  { value: "Loose Fit", label: "Loose" }, { value: "Athletic Fit", label: "Athletic" },
];
const STAGIONI = ["Primavera / Estate", "Autunno / Inverno", "Tutto l'anno"];
const UTILIZZI = ["Training / Warm-up", "Gara", "Casual", "Allenamento"];
const COLLI = ["Girocollo", "V-neck", "Polo", "Zip", "Cappuccio", "Collo alto", "Bomber"];
const MANICHE = ["Corte", "Lunghe", "Senza maniche", "3/4", "Raglan", "Giro Manica"];

function SelectField({ label, value, options, onChange, className }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

export interface TabArticoloHandle {
  save: () => Promise<void>;
}

const CATEGORIE_SENZA_COLLO_MANICHE = ["Short", "Skirt", "Sweatpants"];
const CATEGORIE_COSTINA = ["Hoodie", "Zip Hoodie", "Sweatshirt", "Sweatpants"];

const TabArticolo = forwardRef<TabArticoloHandle, Props>(function TabArticolo({ scheda, onSave, clienti, materiali, onMetaChange, modelli: modelliIniziali = [], vociColori = [] }, ref) {
  const [immagini, setImmagini] = useState<string[]>(scheda.immagini || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({
    nomeArticolo: scheda.nomeArticolo,
    codice: scheda.codice,
    codiceModello: scheda.codiceModello || "",
    categoria: scheda.categoria || "",
    vestibilita: scheda.vestibilita || "",
    genere: scheda.genere || "",
    stagione: scheda.stagione || "",
    utilizzo: scheda.utilizzo || "",
    tessutoPrincipale: scheda.tessutoPrincipale || "",
    pesoTessuto: scheda.pesoTessuto || "",
    altezzaTessuto: scheda.altezzaTessuto || "",
    tessutoSecondario: scheda.tessutoSecondario || "",
    pesoTessutoSecondario: scheda.pesoTessutoSecondario || "",
    modellista: scheda.modellista || "",
    fornitoreTessuto: scheda.fornitoreTessuto || "",
    produttore: scheda.produttore || "",
    coloreBase: scheda.coloreBase || "",
    coloriSecondari: scheda.coloriSecondari || "",
    coloreBaseCodice: scheda.coloreBaseCodice || "",
    coloriSecondariCodice: scheda.coloriSecondariCodice || "",
    collo: scheda.collo || "",
    maniche: scheda.maniche || "",
    noteSpecifiche: scheda.noteSpecifiche || "",
    clienteId: scheda.clienteId || "",
    collezione: scheda.collezione || "",
  });

  const [modelli, setModelli] = useState<ModelloBreve[]>(modelliIniziali);
  const [modelloMsg, setModelloMsg] = useState<string | null>(null);

  const mostraColloManiche = !CATEGORIE_SENZA_COLLO_MANICHE.includes(values.categoria);
  const mostraCostina = CATEGORIE_COSTINA.includes(values.categoria);

  // Nome e codice sono obbligatori: vuoti non si salvano (resta il valore precedente).
  const salvaAll = async () => {
    const { nomeArticolo, codice, ...resto } = values;
    await onSave({
      ...resto,
      codiceModello: resto.codiceModello.trim() || null,
      ...(nomeArticolo.trim() ? { nomeArticolo: nomeArticolo.trim() } : {}),
      ...(codice.trim() ? { codice: codice.trim() } : {}),
    });
  };

  useImperativeHandle(ref, () => ({ save: salvaAll }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    const nuove: string[] = [];
    const errori: string[] = [];
    try {
      for (const originale of files) {
        try {
          const file = await preparaImmagine(originale);
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (res.ok) {
            const { url } = await res.json();
            nuove.push(url);
          } else if (res.status === 413) {
            errori.push(`${originale.name}: file troppo grande`);
          } else {
            const body = await res.json().catch(() => null);
            errori.push(`${originale.name}: ${body?.error || `errore ${res.status}`}`);
          }
        } catch {
          errori.push(`${originale.name}: caricamento non riuscito`);
        }
      }
      if (nuove.length) {
        const aggiornate = [...immagini, ...nuove];
        setImmagini(aggiornate);
        await onSave({ immagini: aggiornate });
      }
      if (errori.length) setUploadError(errori.join(" · "));
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const rimuoviImmagine = async (idx: number) => {
    const aggiornate = immagini.filter((_, i) => i !== idx);
    setImmagini(aggiornate);
    await onSave({ immagini: aggiornate });
  };

  const set = (field: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleBlur = async (field: keyof typeof values) => {
    if (field === "codiceModello") {
      const m = trovaModello(modelli, values.codiceModello);
      const v = m ? m.codice : values.codiceModello.trim();
      set("codiceModello", v);
      setModelloMsg(null);
      onMetaChange?.({ codiceModello: v });
      // La categoria della scheda segue quella del modello scelto (anche fuori filtro).
      if (m && m.categoria !== values.categoria) scegli("categoria", m.categoria);
      await onSave({ codiceModello: v || null });
      return;
    }
    if (field === "nomeArticolo" || field === "codice") {
      const v = values[field].trim();
      if (!v) { set(field, field === "codice" ? scheda.codice : scheda.nomeArticolo); return; }
      onMetaChange?.({ [field]: v });
      await onSave({ [field]: v });
      return;
    }
    await onSave({ [field]: values[field] || null });
  };

  // Scelta immediata (chip, segmentati, select): stato + salvataggio nello stesso gesto.
  const scegli = (field: keyof typeof values, value: string) => {
    set(field, value);
    if (field === "categoria") onMetaChange?.({ categoria: value });
    onSave({ [field]: value || null });
  };

  const modelloNuovo = values.codiceModello.trim() !== "" && !trovaModello(modelli, values.codiceModello);

  const aggiungiAiModelli = async () => {
    if (!values.categoria) { setModelloMsg("Scegli prima la categoria dell'articolo: serve anche al modello."); return; }
    const res = await fetch("/api/modelli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codice: values.codiceModello.trim(), descrizione: values.nomeArticolo.trim(),
        categoria: values.categoria, fascia: fasciaDaGenere(values.genere),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setModelloMsg(body.error || "Non sono riuscito ad aggiungere il modello."); return; }
    setModelli((prev) => [...prev, { codice: body.codice, descrizione: body.descrizione, categoria: body.categoria, fascia: body.fascia }]);
    setModelloMsg(null);
  };

  const text = (field: keyof typeof values) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(field, e.target.value),
    onBlur: () => handleBlur(field),
  });

  const handleTessutoPrincipaleChange = (nome: string) => {
    const mat = materiali.find((m) => m.nome === nome);
    const peso = mat?.peso && mat?.unitaPeso ? `${mat.peso} ${mat.unitaPeso}` : (mat?.peso ?? "");
    const altezza = mat?.larghezza ?? "";
    // Cambiando tessuto, un codice colore che il nuovo tessuto non ha non vale più: resta il nome, con l'avviso.
    const codiciNuovi = leggiCodici(mat?.colori);
    const codici = {
      coloreBaseCodice: codiciNuovi.includes(values.coloreBaseCodice) ? values.coloreBaseCodice : "",
      coloriSecondariCodice: codiciNuovi.includes(values.coloriSecondariCodice) ? values.coloriSecondariCodice : "",
    };
    setValues((v) => ({
      ...v,
      tessutoPrincipale: nome,
      ...codici,
      ...(peso ? { pesoTessuto: peso } : {}),
      ...(altezza ? { altezzaTessuto: altezza } : {}),
    }));
    onSave({
      tessutoPrincipale: nome || null,
      coloreBaseCodice: codici.coloreBaseCodice || null,
      coloriSecondariCodice: codici.coloriSecondariCodice || null,
      ...(peso ? { pesoTessuto: peso } : {}),
      ...(altezza ? { altezzaTessuto: altezza } : {}),
    });
  };

  const tessutoPrincipale = materiali.find((m) => m.nome === values.tessutoPrincipale);
  const coloriPrincipale = coloriTessuto(leggiCodici(tessutoPrincipale?.colori), dizionarioFornitore(vociColori, tessutoPrincipale?.fornitore), leggiNomiTessuto(tessutoPrincipale?.coloriNomi));
  const scegliColore = (campo: "coloreBase" | "coloriSecondari") => (nome: string, codice: string | null) => {
    const campoCodice = campo === "coloreBase" ? "coloreBaseCodice" : "coloriSecondariCodice";
    setValues((v) => ({ ...v, [campo]: nome, [campoCodice]: codice ?? "" }));
    onSave({ [campo]: nome || null, [campoCodice]: codice });
  };

  const handleTessutoSecondarioChange = (nome: string) => {
    const mat = materiali.find((m) => m.nome === nome);
    const peso = mat?.peso && mat?.unitaPeso ? `${mat.peso} ${mat.unitaPeso}` : (mat?.peso ?? "");
    setValues((v) => ({ ...v, tessutoSecondario: nome, ...(peso ? { pesoTessutoSecondario: peso } : {}) }));
    onSave({ tessutoSecondario: nome || null, ...(peso ? { pesoTessutoSecondario: peso } : {}) });
  };

  const tessutoOptions = materiali.length > 0
    ? materiali.map((m) => m.nome)
    : ["Poliammide + Elastane", "100% Poliestere", "100% Cotone", "60% Cotone + 40% Poliestere"];

  const grammatura = parseGrammaturaCommerciale(values.pesoTessuto, values.altezzaTessuto);

  return (
    <div className="space-y-4">
      {/* Immagini prodotto: prima cosa della scheda, la prima foto fa da copertina */}
      <SectionCard title="Immagini prodotto" action={<span className="text-xs text-[#5F6878]">La prima è la copertina</span>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {immagini.map((img, i) => (
            <div key={img + i} className="relative group h-32 rounded-xl bg-[#EEEBE3] overflow-hidden">
              <img src={img} alt={`Immagine ${i + 1}`} className="w-full h-full object-contain" />
              {i === 0 && (
                <span className="absolute left-2 bottom-2 text-[11px] font-semibold bg-[#0E1B2C] text-white px-2 py-0.5 rounded-md">Copertina</span>
              )}
              <button type="button" onClick={() => rimuoviImmagine(i)} aria-label={`Rimuovi immagine ${i + 1}`}
                className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/95 text-[#0E1B2C] shadow flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className={`h-32 rounded-xl border-2 border-dashed border-[#C9C3B5] bg-[#FBFAF7] text-[#1F3A68] flex flex-col items-center justify-center gap-1.5 text-sm font-semibold hover:border-[#1F3A68] transition-colors disabled:opacity-60 ${immagini.length === 0 ? "col-span-2 sm:col-span-3 lg:col-span-5" : ""}`}>
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <span className="flex gap-2"><Camera size={20} /><Upload size={20} /></span>}
            {uploading ? "Caricamento…" : "Scatta o carica foto"}
            {!uploading && <span className="text-xs font-normal text-[#5F6878]">Fotocamera o galleria · JPG, PNG, HEIC</span>}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        {uploadError && <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>}
      </SectionCard>

      <SectionCard title="Articolo">
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-3 items-start">
            <Field label="Nome articolo" className="col-span-2">
              <input type="text" {...text("nomeArticolo")} placeholder="es. Hoodie Tecnico Pro" className={inputCls} />
            </Field>
            <div className="flex flex-col gap-1.5 text-[13px] text-[#4A5566]">
              <label htmlFor={`modello-${scheda.id}`}>Modello (modellista)</label>
              <CampoModello id={`modello-${scheda.id}`} value={values.codiceModello} modelli={modelli}
                categoria={values.categoria} genere={values.genere}
                onChange={(v) => set("codiceModello", v)} onBlur={() => handleBlur("codiceModello")} />
            </div>
            <Field label="Codice scheda">
              <input type="text" {...text("codice")} autoCapitalize="characters" className={`${inputCls} font-mono`} />
            </Field>
          </div>

          {modelloNuovo && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#FBEDE5] border border-[#F2D2C1] px-4 py-3 text-sm text-[#0E1B2C]">
              <span>
                <strong className="font-mono">{values.codiceModello.trim()}</strong> non è tra i Modelli.
                {modelloMsg && <span className="block text-red-800 mt-1">{modelloMsg}</span>}
              </span>
              <button type="button" onClick={aggiungiAiModelli}
                className="h-10 px-4 rounded-lg bg-[#0E1B2C] hover:bg-[#1F3A68] text-white text-sm font-semibold">
                Aggiungi ai Modelli
              </button>
            </div>
          )}

          <ChipGroup label="Categoria" options={CATEGORIE} value={values.categoria} onChange={(v) => scegli("categoria", v)} />

          <div className="grid grid-cols-2 gap-4">
            <Segmented label="Genere" options={GENERI} value={values.genere} onChange={(v) => scegli("genere", v)} />
            <Segmented label="Vestibilità" options={VESTIBILITA} value={values.vestibilita} onChange={(v) => scegli("vestibilita", v)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Stagione" value={values.stagione} options={STAGIONI} onChange={(v) => scegli("stagione", v)} />
            <SelectField label="Utilizzo" value={values.utilizzo} options={UTILIZZI} onChange={(v) => scegli("utilizzo", v)} />
            <Field label="Collezione">
              <input type="text" {...text("collezione")} placeholder="es. SS26" className={inputCls} />
            </Field>
          </div>

          <Field label="Cliente / club" group>
            <div className="flex items-center gap-2">
              <select value={values.clienteId} onChange={(e) => scegli("clienteId", e.target.value)} aria-label="Cliente" className={inputCls}>
                <option value="">Nessun cliente</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <Link href="/clienti/nuovo" target="_blank" aria-label="Crea nuovo cliente"
                className="w-11 h-11 flex-shrink-0 rounded-[10px] border border-[#D6D1C4] bg-white text-[#1F3A68] flex items-center justify-center hover:border-[#1F3A68]">
                <ExternalLink size={16} />
              </Link>
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tessuto e dettagli">
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tessuto principale" value={values.tessutoPrincipale} options={tessutoOptions}
            onChange={handleTessutoPrincipaleChange} />
          <Field label="Peso (da scheda tecnica)">
            <input type="text" {...text("pesoTessuto")} placeholder="es. 260 g/m²" className={inputCls} />
          </Field>
          <Field label="Altezza tessuto">
            <input type="text" {...text("altezzaTessuto")} placeholder="es. 150 cm" className={inputCls} />
          </Field>
          <div className="col-span-3 flex items-center justify-between rounded-[10px] bg-[#EEF2F8] px-4 h-11 text-[15px]">
            <span className="text-[#4A5566] text-[13px]">Grammatura commerciale</span>
            {grammatura !== null
              ? <span className="font-mono text-[#1F3A68] font-medium">{grammatura.toFixed(0)} g/m²</span>
              : <span className="text-[#5F6878] text-[13px]">Serve peso (g/m o g/m²) e altezza</span>}
          </div>

          {mostraCostina && (
            <>
              <SelectField label="Costina" value={values.tessutoSecondario} className="col-span-2"
                options={materiali.length > 0 ? materiali.map((m) => m.nome) : ["Costina 1x1", "Costina 2x2", "Ribbed Knit"]}
                onChange={handleTessutoSecondarioChange} />
              <Field label="Peso costina">
                <input type="text" {...text("pesoTessutoSecondario")} placeholder="es. 220 g/m²" className={inputCls} />
              </Field>
            </>
          )}

          {/* Con i colori del tessuto le due scelte vanno una sotto l'altra: le cartelle hanno fino a 20 colori. */}
          <div className={`col-span-3 grid gap-3 ${coloriPrincipale.length ? "grid-cols-1" : "grid-cols-2"}`}>
            <Field label="Colore base" group>
              <SceltaColoreTessuto value={values.coloreBase} codice={values.coloreBaseCodice} colori={coloriPrincipale}
                tessuto={values.tessutoPrincipale} fornitore={tessutoPrincipale?.fornitore ?? null}
                onChange={scegliColore("coloreBase")} placeholder="es. Blu royal" />
            </Field>
            <Field label="Colori secondari" group>
              <SceltaColoreTessuto value={values.coloriSecondari} codice={values.coloriSecondariCodice} colori={coloriPrincipale}
                tessuto={values.tessutoPrincipale} fornitore={tessutoPrincipale?.fornitore ?? null}
                onChange={scegliColore("coloriSecondari")} placeholder="es. Blu navy" />
            </Field>
          </div>

          {mostraColloManiche && (
            <>
              <ChipGroup label="Collo" options={COLLI} value={values.collo} onChange={(v) => scegli("collo", v)} className="col-span-3" />
              <ChipGroup label="Maniche" options={MANICHE} value={values.maniche} onChange={(v) => scegli("maniche", v)} className="col-span-3" />
            </>
          )}

          <Field label="Note sull'articolo" className="col-span-3">
            <textarea {...text("noteSpecifiche")} rows={2} className={textareaCls} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Fornitori e referenti">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Modellista"><input type="text" {...text("modellista")} className={inputCls} /></Field>
          <Field label="Fornitore tessuto"><input type="text" {...text("fornitoreTessuto")} className={inputCls} /></Field>
          <Field label="Produttore / fasonista"><input type="text" {...text("produttore")} className={inputCls} /></Field>
        </div>
      </SectionCard>
    </div>
  );
});

export default TabArticolo;
