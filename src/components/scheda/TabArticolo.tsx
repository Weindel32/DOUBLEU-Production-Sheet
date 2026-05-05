"use client";

import { useState, useRef } from "react";
import { Edit3, Upload, X, Loader2, Save } from "lucide-react";
import { CATEGORIE } from "@/lib/utils";
import type { SchedaCompleta } from "@/types";

interface Props {
  scheda: SchedaCompleta;
  onSave: (data: Partial<SchedaCompleta>) => Promise<void>;
  clienti: { id: string; nome: string }[];
  materiali: { id: string; nome: string; tipo: string; costoMetro: number | null }[];
}

export default function TabArticolo({ scheda, onSave, clienti, materiali }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [immagini, setImmagini] = useState<string[]>(scheda.immagini || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const salvaAll = async () => {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const infoGeneraliFirstField = "nomeArticolo";
  const specificheProdottoFirstField = "tessutoPrincipale";
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const nuove: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        nuove.push(url);
      }
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

  const Field = ({ label, field, type = "text", options }: {
    label: string;
    field: keyof typeof values;
    type?: string;
    options?: string[];
  }) => (
    <div className="flex items-start py-2 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-sm text-gray-400 w-32 flex-shrink-0 mt-0.5">{label}</span>
      {options ? (
        <select
          value={values[field]}
          onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          onBlur={() => handleBlur(field)}
          className="flex-1 text-sm font-medium text-gray-700 bg-transparent border-0 focus:ring-0 cursor-pointer"
        >
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : editing === field ? (
        <input
          autoFocus
          type={type}
          value={values[field]}
          onChange={(e) => setValues((v) => ({ ...v, [field]: e.target.value }))}
          onBlur={() => handleBlur(field)}
          className="flex-1 text-sm font-medium text-gray-700 border-b border-blue-400 bg-transparent outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(field)}
          className="flex-1 text-sm font-medium text-gray-700 text-left hover:text-blue-700 transition-colors group flex items-center gap-1"
        >
          {values[field] || <span className="text-gray-300 italic">—</span>}
          <Edit3 size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-5">
      {/* Informazioni generali */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Informazioni generali</h3>
          <button onClick={() => setEditing(infoGeneraliFirstField)} title="Modifica">
            <Edit3 size={14} className="text-gray-400 hover:text-blue-600 transition-colors" />
          </button>
        </div>
        <Field label="Nome articolo" field="nomeArticolo" />
        <Field label="Categoria" field="categoria" options={CATEGORIE} />
        <Field label="Vestibilità" field="vestibilita" options={["Regular Fit", "Slim Fit", "Loose Fit", "Athletic Fit"]} />
        <Field label="Genere" field="genere" options={["Unisex", "Uomo", "Donna", "Junior"]} />
        <Field label="Stagione" field="stagione" options={["Primavera / Estate", "Autunno / Inverno", "Tutto l'anno"]} />
        <Field label="Utilizzo" field="utilizzo" options={["Training / Warm-up", "Gara", "Casual", "Allenamento"]} />
        <div className="flex items-start py-2 gap-4">
          <span className="text-sm text-gray-400 w-32 flex-shrink-0">Cliente</span>
          <select
            value={values.clienteId}
            onChange={async (e) => {
              setValues((v) => ({ ...v, clienteId: e.target.value }));
              await onSave({ clienteId: e.target.value || null });
            }}
            className="flex-1 text-sm font-medium text-gray-700 bg-transparent border-0 focus:ring-0 cursor-pointer"
          >
            <option value="">Nessun cliente</option>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <Field label="Collezione" field="collezione" />
      </div>

      {/* Immagini prodotto */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Immagini prodotto</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {immagini.length === 0 ? (
            <div className="col-span-2 h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 text-sm">
              Nessuna immagine
            </div>
          ) : (
            immagini.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt={`Immagine ${i + 1}`} className="w-full h-32 object-contain rounded-lg bg-gray-50" />
                <button
                  onClick={() => rimuoviImmagine(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? "Caricamento..." : "Carica immagini"}
          {!uploading && <span className="text-xs">PNG, JPG fino a 10MB</span>}
        </button>
      </div>

      {/* Specifiche prodotto */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Specifiche prodotto</h3>
          <button onClick={() => setEditing(specificheProdottoFirstField)} title="Modifica">
            <Edit3 size={14} className="text-gray-400 hover:text-blue-600 transition-colors" />
          </button>
        </div>
        <Field label="Tessuto principale" field="tessutoPrincipale" options={
          materiali.length > 0
            ? materiali.map((m) => m.nome)
            : ["Poliammide + Elastane", "100% Poliestere", "100% Cotone", "60% Cotone + 40% Poliestere"]
        } />
        <Field label="Peso tessuto" field="pesoTessuto" />
        <Field label="Altezza tessuto" field="altezzaTessuto" />
        <div className="flex items-center py-2 border-b border-gray-100 gap-4">
          <span className="text-sm text-gray-400 w-32 flex-shrink-0">Colore base</span>
          <div className="flex items-center gap-2">
            {values.coloreBase && (
              <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: values.coloreBase }} />
            )}
            <input
              type="text"
              value={values.coloreBase}
              onChange={(e) => setValues((v) => ({ ...v, coloreBase: e.target.value }))}
              onBlur={() => handleBlur("coloreBase")}
              placeholder="es. Blu royal"
              className="text-sm font-medium text-gray-700 border-0 bg-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex items-center py-2 border-b border-gray-100 gap-4">
          <span className="text-sm text-gray-400 w-32 flex-shrink-0">Colori secondari</span>
          <input
            type="text"
            value={values.coloriSecondari}
            onChange={(e) => setValues((v) => ({ ...v, coloriSecondari: e.target.value }))}
            onBlur={() => handleBlur("coloriSecondari")}
            placeholder="es. Blu navy"
            className="text-sm font-medium text-gray-700 border-0 bg-transparent outline-none"
          />
        </div>
        <Field label="Collo" field="collo" options={["Girocollo", "V-neck", "Polo", "Zip", "Cappuccio"]} />
        <Field label="Maniche" field="maniche" options={["Corte", "Lunghe", "Senza maniche", "3/4", "Raglan", "Giro Manica"]} />
        <div className="flex items-start py-2 gap-4">
          <span className="text-sm text-gray-400 w-32 flex-shrink-0 mt-0.5">Note</span>
          <textarea
            value={values.noteSpecifiche}
            onChange={(e) => setValues((v) => ({ ...v, noteSpecifiche: e.target.value }))}
            onBlur={() => handleBlur("noteSpecifiche")}
            rows={2}
            className="flex-1 text-sm text-gray-700 border-0 bg-transparent resize-none outline-none"
          />
        </div>
      </div>
      </div>

      {/* Fornitori & Referenti */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Fornitori & Referenti</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Modellista</div>
            <input
              type="text"
              value={values.modellista}
              onChange={(e) => setValues((v) => ({ ...v, modellista: e.target.value }))}
              onBlur={() => handleBlur("modellista")}
              placeholder="Nome modellista..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none"
            />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Fornitore tessuto</div>
            <input
              type="text"
              value={values.fornitoreTessuto}
              onChange={(e) => setValues((v) => ({ ...v, fornitoreTessuto: e.target.value }))}
              onBlur={() => handleBlur("fornitoreTessuto")}
              placeholder="Nome fornitore..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none"
            />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Produttore / Fasonista</div>
            <input
              type="text"
              value={values.produttore}
              onChange={(e) => setValues((v) => ({ ...v, produttore: e.target.value }))}
              onBlur={() => handleBlur("produttore")}
              placeholder="Nome produttore..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:border-blue-400 outline-none"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-end pt-2">
      <button
        onClick={salvaAll}
        disabled={saving}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? "Salvataggio..." : "Salva"}
      </button>
    </div>
  );
}
