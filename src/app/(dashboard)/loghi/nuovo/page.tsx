"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import Link from "next/link";

const TIPI_LOGO = ["Ricamo", "Stampa", "Sublimazione", "Vinile", "Transfer", "Patch", "Altro"];

export default function NuovoLogoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [form, setForm] = useState({ nome: "", tipo: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) { const { url } = await res.json(); setFileUrl(url); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/loghi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, tipo: form.tipo, file: fileUrl }),
    });
    router.push("/loghi");
  };

  return (
    <div className="p-6 max-w-xl">
      <Link href="/loghi" className="flex items-center gap-2 text-sm text-[#8ba3c7] hover:text-white mb-6">
        <ArrowLeft size={16} /> Torna alla libreria
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Aggiungi logo</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-sm text-[#8ba3c7] block mb-1">Nome logo *</label>
          <input required type="text" value={form.nome} onChange={(e) => set("nome", e.target.value)}
            placeholder="es. Logo Club Fronte"
            className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
        </div>
        <div>
          <label className="text-sm text-[#8ba3c7] block mb-1">Tipo applicazione *</label>
          <select required value={form.tipo} onChange={(e) => set("tipo", e.target.value)}
            className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none">
            <option value="">Seleziona</option>
            {TIPI_LOGO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-[#8ba3c7] block mb-1">File immagine *</label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleFileUpload} />
          {fileUrl ? (
            <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center gap-3">
              <img src={fileUrl} alt="Logo caricato" className="w-12 h-12 object-contain rounded" />
              <div className="flex-1">
                <div className="text-sm text-green-700 font-medium">File caricato</div>
                <button type="button" onClick={() => setFileUrl("")} className="text-xs text-[#4e6585] hover:text-red-500 transition-colors">Rimuovi</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full border-2 border-dashed border-white/10 rounded-lg py-6 flex flex-col items-center gap-2 text-sm text-[#4e6585] hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              {uploading ? "Caricamento..." : "Carica file immagine"}
              {!uploading && <span className="text-xs">PNG, JPG, SVG, WebP</span>}
            </button>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/loghi" className="flex-1 text-center border border-white/15 text-[#8ba3c7] px-4 py-2 rounded-lg text-sm hover:bg-white/[0.03] transition-colors">Annulla</Link>
          <button type="submit" disabled={loading || !form.nome || !form.tipo || !fileUrl}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? "Salvataggio..." : "Salva logo"}
          </button>
        </div>
      </form>
    </div>
  );
}
