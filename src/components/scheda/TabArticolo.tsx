"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Upload, X, ExternalLink, Loader2 } from "lucide-react";
import { CATEGORIE, parseGrammaturaCommerciale } from "@/lib/utils";
import type { SchedaCompleta } from "@/types";
import ColorPickerNamed from "@/components/ui/ColorPickerNamed";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  clienti: { id: string; nome: string }[];
  materiali: { id: string; nome: string; tipo: string; costoMetro: number | null; peso: string | null; unitaPeso: string | null; larghezza: string | null }[];
}

export interface TabArticoloHandle {
  save: () => Promise<void>;
}

const CATEGORIE_SENZA_COLLO_MANICHE = ["Short", "Skirt", "Sweatpants"];
const CATEGORIE_COSTINA = ["Hoodie", "Zip Hoodie", "Sweatshirt", "Sweatpants"];

const TabArticolo = forwardRef<TabArticoloHandle, Props>(function TabArticolo({ scheda, onSave, clienti, materiali }, ref) {
  const [immagini, setImmagini] = useState<string[]>(scheda.immagini || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({
    nomeArticolo: scheda.nomeArticolo,
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
    collo: scheda.collo || "",
    maniche: scheda.maniche || "",
    noteSpecifiche: scheda.noteSpecifiche || "",
    clienteId: scheda.clienteId || "",
    collezione: scheda.collezione || "",
  });

  const mostraColloManiche = !CATEGORIE_SENZA_COLLO_MANICHE.includes(values.categoria);
  const mostraCostina = CATEGORIE_COSTINA.includes(values.categoria);

  const salvaAll = async () => {
    await onSave(values);
  };

  useImperativeHandle(ref, () => ({ save: salvaAll }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const nuove: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) { const { url } = await res.json(); nuove.push(url); }
    }
    const aggiornate = [...immagini, ...nuove];
    setImmagini(aggiornate);
    await onSave({ immagini: aggiornate });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rimuoviImmagine = async (idx: number) => {
    const aggiornate = immagini.filter((_, i) => i !== idx);
    setImmagini(aggiornate);
    await onSave({ immagini: aggiornate });
  };

  const set = (field: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleBlur = async (field: keyof typeof values) => {
    await onSave({ [field]: values[field] || null });
  };

  const handleTessutoPrincipaleChange = (nome: string) => {
    const mat = materiali.find((m) => m.nome === nome);
    const peso = mat?.peso && mat?.unitaPeso ? `${mat.peso} ${mat.unitaPeso}` : (mat?.peso ?? "");
    const altezza = mat?.larghezza ?? "";
    setValues((v) => ({
      ...v,
      tessutoPrincipale: nome,
      ...(peso ? { pesoTessuto: peso } : {}),
      ...(altezza ? { altezzaTessuto: altezza } : {}),
    }));
    onSave({
      tessutoPrincipale: nome || null,
      ...(peso ? { pesoTessuto: peso } : {}),
      ...(altezza ? { altezzaTessuto: altezza } : {}),
    });
  };

  const handleTessutoSecondarioChange = (nome: string) => {
    const mat = materiali.find((m) => m.nome === nome);
    const peso = mat?.peso && mat?.unitaPeso ? `${mat.peso} ${mat.unitaPeso}` : (mat?.peso ?? "");
    setValues((v) => ({ ...v, tessutoSecondario: nome, ...(peso ? { pesoTessutoSecondario: peso } : {}) }));
    onSave({ tessutoSecondario: nome || null, ...(peso ? { pesoTessutoSecondario: peso } : {}) });
  };

  // Campo sempre editabile: niente più click-per-modificare, solo label + input/select diretti.
  const FieldInput = ({ label, field, options, placeholder }: {
    label: string; field: keyof typeof values; options?: string[]; placeholder?: string;
  }) => (
    <div>
      <label className="text-xs text-[#4e6585] block mb-1">{label}</label>
      {options ? (
        <select
          value={values[field]}
          onChange={(e) => { set(field, e.target.value); onSave({ [field]: e.target.value || null }); }}
          className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 bg-[#1a3060] focus:border-blue-500/50 outline-none"
        >
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={values[field]}
          onChange={(e) => set(field, e.target.value)}
          onBlur={() => handleBlur(field)}
          placeholder={placeholder}
          className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none"
        />
      )}
    </div>
  );

  const tessutoOptions = materiali.length > 0
    ? materiali.map((m) => m.nome)
    : ["Poliammide + Elastane", "100% Poliestere", "100% Cotone", "60% Cotone + 40% Poliestere"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">

        {/* Informazioni generali */}
        <div className="card">
          <h3 className="section-title mb-3">Informazioni generali</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FieldInput label="Nome articolo" field="nomeArticolo" placeholder="es. Hoodie Tecnico Pro" />
            </div>
            <FieldInput label="Categoria" field="categoria" options={CATEGORIE} />
            <FieldInput label="Vestibilità" field="vestibilita" options={["Regular Fit", "Slim Fit", "Loose Fit", "Athletic Fit"]} />
            <FieldInput label="Genere" field="genere" options={["Unisex", "Uomo", "Donna", "Junior"]} />
            <FieldInput label="Stagione" field="stagione" options={["Primavera / Estate", "Autunno / Inverno", "Tutto l'anno"]} />
            <FieldInput label="Utilizzo" field="utilizzo" options={["Training / Warm-up", "Gara", "Casual", "Allenamento"]} />
            <FieldInput label="Collezione" field="collezione" placeholder="es. SS26" />
            <div className="col-span-2">
              <label className="text-xs text-[#4e6585] block mb-1">Cliente</label>
              <div className="flex items-center gap-2">
                <select value={values.clienteId}
                  onChange={async (e) => {
                    setValues((v) => ({ ...v, clienteId: e.target.value }));
                    await onSave({ clienteId: e.target.value || null });
                  }}
                  className="flex-1 text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 bg-[#1a3060] focus:border-blue-500/50 outline-none">
                  <option value="">Nessun cliente</option>
                  {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <Link href="/clienti/nuovo" target="_blank" title="Crea nuovo cliente"
                  className="text-[#4e6585] hover:text-blue-500 transition-colors flex-shrink-0">
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Specifiche prodotto */}
        <div className="card">
          <h3 className="section-title mb-3">Specifiche prodotto</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#4e6585] block mb-1">Tessuto principale</label>
              <select value={values.tessutoPrincipale} onChange={(e) => handleTessutoPrincipaleChange(e.target.value)}
                className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 bg-[#1a3060] focus:border-blue-500/50 outline-none">
                <option value="">—</option>
                {tessutoOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <FieldInput label="Peso tessuto (da scheda tecnica)" field="pesoTessuto" placeholder="es. 260 g/m²" />
            <FieldInput label="Altezza tessuto" field="altezzaTessuto" placeholder="es. 150 cm" />
            <div className="col-span-2">
              <label className="text-xs text-[#4e6585] block mb-1">Grammatura commerciale</label>
              {(() => {
                const grammatura = parseGrammaturaCommerciale(values.pesoTessuto, values.altezzaTessuto);
                return (
                  <div className="text-sm text-blue-300 border border-white/10 rounded-lg px-3 py-2 bg-[#1a3060]/50">
                    {grammatura !== null
                      ? `${grammatura.toFixed(0)} g/m²`
                      : <span className="text-[#4e6585] italic">Inserisci peso (con unità g/m o g/m²) e altezza tessuto</span>}
                  </div>
                );
              })()}
            </div>

            {mostraCostina && (
              <>
                <div className="col-span-2">
                  <label className="text-xs text-[#4e6585] block mb-1">Costina</label>
                  <select value={values.tessutoSecondario} onChange={(e) => handleTessutoSecondarioChange(e.target.value)}
                    className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 bg-[#1a3060] focus:border-blue-500/50 outline-none">
                    <option value="">—</option>
                    {materiali.length > 0
                      ? materiali.map((m) => <option key={m.nome} value={m.nome}>{m.nome}</option>)
                      : ["Costina 1x1", "Costina 2x2", "Ribbed Knit"].map((o) => <option key={o} value={o}>{o}</option>)
                    }
                  </select>
                </div>
                <FieldInput label="Peso costina" field="pesoTessutoSecondario" placeholder="es. 220 g/m²" />
              </>
            )}

            <div>
              <label className="text-xs text-[#4e6585] block mb-1">Colore base</label>
              <ColorPickerNamed
                value={values.coloreBase}
                onChange={(val) => { set("coloreBase", val); onSave({ coloreBase: val || null }); }}
                placeholder="es. Blu royal"
              />
            </div>
            <div>
              <label className="text-xs text-[#4e6585] block mb-1">Colori secondari</label>
              <ColorPickerNamed
                value={values.coloriSecondari}
                onChange={(val) => { set("coloriSecondari", val); onSave({ coloriSecondari: val || null }); }}
                placeholder="es. Blu navy"
              />
            </div>

            {mostraColloManiche && (
              <>
                <FieldInput label="Collo" field="collo" options={["Girocollo", "V-neck", "Polo", "Zip", "Cappuccio"]} />
                <FieldInput label="Maniche" field="maniche" options={["Corte", "Lunghe", "Senza maniche", "3/4", "Raglan", "Giro Manica"]} />
              </>
            )}

            <div className="col-span-2">
              <label className="text-xs text-[#4e6585] block mb-1">Note</label>
              <textarea value={values.noteSpecifiche}
                onChange={(e) => set("noteSpecifiche", e.target.value)}
                onBlur={() => handleBlur("noteSpecifiche")} rows={2}
                className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 resize-none focus:border-blue-500/50 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Immagini prodotto — riga a piena larghezza per dare più spazio alle anteprime */}
      <div className="card">
        <h3 className="section-title mb-3">Immagini prodotto</h3>
        <div className="grid grid-cols-6 gap-3 mb-3">
          {immagini.length === 0 ? (
            <div className="col-span-6 h-32 bg-white/[0.03] rounded-lg flex items-center justify-center text-[#4e6585] text-sm">Nessuna immagine</div>
          ) : immagini.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt={`Immagine ${i + 1}`} className="w-full h-28 object-contain rounded-lg bg-white/[0.03]" />
              <button onClick={() => rimuoviImmagine(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full border-2 border-dashed border-white/10 rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-[#4e6585] hover:border-blue-500/40 hover:text-blue-500 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Caricamento..." : "Carica immagini"}
          {!uploading && <span className="text-xs">PNG, JPG fino a 10MB</span>}
        </button>
      </div>

      {/* Fornitori & Referenti */}
      <div className="card">
        <h3 className="section-title mb-3">Fornitori & Referenti</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Modellista", field: "modellista" as const, placeholder: "Nome modellista..." },
            { label: "Fornitore tessuto", field: "fornitoreTessuto" as const, placeholder: "Nome fornitore..." },
            { label: "Produttore / Fasonista", field: "produttore" as const, placeholder: "Nome produttore..." },
          ].map(({ label, field, placeholder }) => (
            <FieldInput key={field} label={label} field={field} placeholder={placeholder} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default TabArticolo;
