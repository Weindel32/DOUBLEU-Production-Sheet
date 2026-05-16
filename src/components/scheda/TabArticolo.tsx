"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Edit3, Upload, X, ExternalLink, Loader2 } from "lucide-react";
import { CATEGORIE } from "@/lib/utils";
import type { SchedaCompleta } from "@/types";

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
  const [editing, setEditing] = useState<string | null>(null);
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

  const handleBlur = async (field: string) => {
    setEditing(null);
    await onSave({ [field]: values[field as keyof typeof values] || null });
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

  const Field = ({ label, field, type = "text", options }: {
    label: string; field: keyof typeof values; type?: string; options?: string[];
  }) => (
    <div className="flex items-start py-2 border-b border-white/8 last:border-0 gap-4">
      <span className="text-sm text-[#4e6585] w-32 flex-shrink-0 mt-0.5">{label}</span>
      {options ? (
        <select value={values[field]} onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          onBlur={() => handleBlur(field)}
          className="flex-1 text-sm font-medium text-[#e8edf4] bg-transparent border-0 focus:ring-0 cursor-pointer">
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : editing === field ? (
        <input autoFocus type={type} value={values[field]}
          onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          onBlur={() => handleBlur(field)}
          className="flex-1 text-sm font-medium text-[#e8edf4] border-b border-blue-500/50 bg-transparent outline-none" />
      ) : (
        <button onClick={() => setEditing(field)}
          className="flex-1 text-sm font-medium text-[#e8edf4] text-left hover:text-blue-400 transition-colors group flex items-center gap-1">
          {values[field] || <span className="text-[#4e6585] italic">—</span>}
          <Edit3 size={12} className="opacity-0 group-hover:opacity-100 text-[#4e6585]" />
        </button>
      )}
    </div>
  );

  const tessutoOptions = materiali.length > 0
    ? materiali.map((m) => m.nome)
    : ["Poliammide + Elastane", "100% Poliestere", "100% Cotone", "60% Cotone + 40% Poliestere"];

  return (
    <>
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-5">

        {/* Informazioni generali */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Informazioni generali</h3>
            <button onClick={() => setEditing("nomeArticolo")} title="Modifica">
              <Edit3 size={14} className="text-[#4e6585] hover:text-blue-400 transition-colors" />
            </button>
          </div>
          <Field label="Nome articolo" field="nomeArticolo" />
          <Field label="Categoria" field="categoria" options={CATEGORIE} />
          <Field label="Vestibilità" field="vestibilita" options={["Regular Fit", "Slim Fit", "Loose Fit", "Athletic Fit"]} />
          <Field label="Genere" field="genere" options={["Unisex", "Uomo", "Donna", "Junior"]} />
          <Field label="Stagione" field="stagione" options={["Primavera / Estate", "Autunno / Inverno", "Tutto l'anno"]} />
          <Field label="Utilizzo" field="utilizzo" options={["Training / Warm-up", "Gara", "Casual", "Allenamento"]} />
          <div className="flex items-start py-2 gap-4">
            <span className="text-sm text-[#4e6585] w-32 flex-shrink-0">Cliente</span>
            <div className="flex-1 flex items-center gap-2">
              <select value={values.clienteId}
                onChange={async (e) => {
                  setValues((v) => ({ ...v, clienteId: e.target.value }));
                  await onSave({ clienteId: e.target.value || null });
                }}
                className="flex-1 text-sm font-medium text-[#e8edf4] bg-transparent border-0 focus:ring-0 cursor-pointer">
                <option value="">Nessun cliente</option>
                {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <Link href="/clienti/nuovo" target="_blank" title="Crea nuovo cliente"
                className="text-[#4e6585] hover:text-blue-500 transition-colors flex-shrink-0">
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
          <Field label="Collezione" field="collezione" />
        </div>

        {/* Immagini prodotto */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Immagini prodotto</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {immagini.length === 0 ? (
              <div className="col-span-2 h-32 bg-white/[0.03] rounded-lg flex items-center justify-center text-[#4e6585] text-sm">Nessuna immagine</div>
            ) : immagini.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt={`Immagine ${i + 1}`} className="w-full h-32 object-contain rounded-lg bg-white/[0.03]" />
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

        {/* Specifiche prodotto */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Specifiche prodotto</h3>
            <button onClick={() => setEditing("tessutoPrincipale")} title="Modifica">
              <Edit3 size={14} className="text-[#4e6585] hover:text-blue-400 transition-colors" />
            </button>
          </div>

          {/* Tessuto principale con auto-fill */}
          <div className="flex items-start py-2 border-b border-white/8 gap-4">
            <span className="text-sm text-[#4e6585] w-32 flex-shrink-0 mt-0.5">Tessuto principale</span>
            <select value={values.tessutoPrincipale} onChange={(e) => handleTessutoPrincipaleChange(e.target.value)}
              className="flex-1 text-sm font-medium text-[#e8edf4] bg-transparent border-0 focus:ring-0 cursor-pointer">
              <option value="">—</option>
              {tessutoOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <Field label="Peso tessuto" field="pesoTessuto" />
          <Field label="Altezza tessuto" field="altezzaTessuto" />

          {/* Costina — solo Hoodie, Zip Hoodie, Sweatshirt, Sweatpants */}
          {mostraCostina && (
            <>
              <div className="flex items-start py-2 border-b border-white/8 gap-4">
                <span className="text-sm text-[#4e6585] w-32 flex-shrink-0 mt-0.5">Costina</span>
                <select value={values.tessutoSecondario} onChange={(e) => handleTessutoSecondarioChange(e.target.value)}
                  className="flex-1 text-sm font-medium text-[#e8edf4] bg-transparent border-0 focus:ring-0 cursor-pointer">
                  <option value="">—</option>
                  {materiali.length > 0
                    ? materiali.map((m) => <option key={m.nome} value={m.nome}>{m.nome}</option>)
                    : ["Costina 1x1", "Costina 2x2", "Ribbed Knit"].map((o) => <option key={o} value={o}>{o}</option>)
                  }
                </select>
              </div>
              <Field label="Peso costina" field="pesoTessutoSecondario" />
            </>
          )}

          <div className="flex items-center py-2 border-b border-white/8 gap-4">
            <span className="text-sm text-[#4e6585] w-32 flex-shrink-0">Colore base</span>
            <div className="flex items-center gap-2">
              {values.coloreBase && <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: values.coloreBase }} />}
              <input type="text" value={values.coloreBase}
                onChange={(e) => setValues((v) => ({ ...v, coloreBase: e.target.value }))}
                onBlur={() => handleBlur("coloreBase")} placeholder="es. Blu royal"
                className="text-sm font-medium text-[#e8edf4] border-0 bg-transparent outline-none" />
            </div>
          </div>
          <div className="flex items-center py-2 border-b border-white/8 gap-4">
            <span className="text-sm text-[#4e6585] w-32 flex-shrink-0">Colori secondari</span>
            <input type="text" value={values.coloriSecondari}
              onChange={(e) => setValues((v) => ({ ...v, coloriSecondari: e.target.value }))}
              onBlur={() => handleBlur("coloriSecondari")} placeholder="es. Blu navy"
              className="text-sm font-medium text-[#e8edf4] border-0 bg-transparent outline-none" />
          </div>

          {/* Collo e Maniche solo per categorie pertinenti */}
          {mostraColloManiche && (
            <>
              <Field label="Collo" field="collo" options={["Girocollo", "V-neck", "Polo", "Zip", "Cappuccio"]} />
              <Field label="Maniche" field="maniche" options={["Corte", "Lunghe", "Senza maniche", "3/4", "Raglan", "Giro Manica"]} />
            </>
          )}

          <div className="flex items-start py-2 gap-4">
            <span className="text-sm text-[#4e6585] w-32 flex-shrink-0 mt-0.5">Note</span>
            <textarea value={values.noteSpecifiche}
              onChange={(e) => setValues((v) => ({ ...v, noteSpecifiche: e.target.value }))}
              onBlur={() => handleBlur("noteSpecifiche")} rows={2}
              className="flex-1 text-sm text-[#e8edf4] border-0 bg-transparent resize-none outline-none" />
          </div>
        </div>
      </div>

      {/* Fornitori & Referenti */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Fornitori & Referenti</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Modellista", field: "modellista", placeholder: "Nome modellista..." },
            { label: "Fornitore tessuto", field: "fornitoreTessuto", placeholder: "Nome fornitore..." },
            { label: "Produttore / Fasonista", field: "produttore", placeholder: "Nome produttore..." },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <div className="text-xs text-[#4e6585] uppercase tracking-wide mb-2">{label}</div>
              <input type="text" value={values[field as keyof typeof values]}
                onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
                onBlur={() => handleBlur(field)} placeholder={placeholder}
                className="w-full text-sm text-[#e8edf4] border border-white/10 rounded-lg px-3 py-2 focus:border-blue-500/50 outline-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
});

export default TabArticolo;
