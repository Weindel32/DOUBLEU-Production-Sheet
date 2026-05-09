"use client";

import { useState, useRef } from "react";
import { Image, PlusCircle, Trash2, Upload, X, Loader2, AlertCircle, ZoomIn } from "lucide-react";
import Link from "next/link";
import { formatData } from "@/lib/utils";

interface Logo {
  id: string;
  nome: string;
  file: string;
  tipo: string;
  createdAt: Date | string;
}

interface Props {
  loghiIniziali: Logo[];
}

export default function LoghiClient({ loghiIniziali }: Props) {
  const [loghi, setLoghi] = useState<Logo[]>(loghiIniziali);
  const [previewLogo, setPreviewLogo] = useState<Logo | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apriPreview = (l: Logo) => setPreviewLogo(l);
  const chiudiPreview = () => setPreviewLogo(null);

  const avviaReplacement = (id: string) => {
    setReplacingId(id);
    setErrore(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    setUploading(true);
    setErrore(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload fallito");
      const { url } = await uploadRes.json();

      const patchRes = await fetch(`/api/loghi/${replacingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: url }),
      });
      if (!patchRes.ok) throw new Error("Aggiornamento fallito");
      const aggiornato = await patchRes.json();
      setLoghi((prev) => prev.map((l) => (l.id === replacingId ? aggiornato : l)));
      if (previewLogo?.id === replacingId) setPreviewLogo(aggiornato);
    } catch {
      setErrore("Errore nel caricamento. Riprova.");
    } finally {
      setUploading(false);
      setReplacingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confermaElimina = async () => {
    if (!deletingId) return;
    setDeleting(true);
    setErrore(null);
    try {
      const res = await fetch(`/api/loghi/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErrore(data.error || "Errore nell'eliminazione");
        return;
      }
      setLoghi((prev) => prev.filter((l) => l.id !== deletingId));
      setDeletingId(null);
    } catch {
      setErrore("Errore nell'eliminazione. Riprova.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Libreria Loghi</h1>
          <p className="text-sm text-[#8ba3c7] mt-0.5">{loghi.length} loghi disponibili</p>
        </div>
        <Link
          href="/loghi/nuovo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Aggiungi logo
        </Link>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {loghi.length === 0 ? (
        <div className="card text-center py-16">
          <Image size={48} className="mx-auto mb-4 text-[#4e6585]" />
          <h2 className="text-[#8ba3c7] font-medium mb-2">Nessun logo</h2>
          <p className="text-[#4e6585] text-sm mb-4">Carica i loghi da usare nelle schede</p>
          <Link
            href="/loghi/nuovo"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <PlusCircle size={16} />
            Aggiungi logo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loghi.map((l) => (
            <div key={l.id} className="card hover:bg-[#162a4e] transition-colors">
              <div
                className="relative w-full aspect-square bg-[#1a3060] rounded-xl mb-3 flex items-center justify-center cursor-pointer group overflow-hidden"
                onClick={() => apriPreview(l)}
              >
                {l.file ? (
                  <img
                    src={l.file}
                    alt={l.nome}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <Image size={28} className="text-[#4e6585]" />
                )}
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={22} className="text-white" />
                </div>
              </div>

              <div className="font-medium text-white text-sm truncate">{l.nome}</div>
              <div className="text-xs text-[#8ba3c7] mt-0.5">{l.tipo}</div>
              <div className="text-xs text-[#4e6585] mt-0.5">{formatData(l.createdAt)}</div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => avviaReplacement(l.id)}
                  disabled={uploading && replacingId === l.id}
                  className="flex-1 flex items-center justify-center gap-1 border border-white/10 rounded-lg py-1.5 text-xs text-[#8ba3c7] hover:border-blue-500/40 hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  {uploading && replacingId === l.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  Sostituisci
                </button>
                <button
                  onClick={() => { setDeletingId(l.id); setErrore(null); }}
                  className="p-1.5 border border-white/10 rounded-lg text-[#4e6585] hover:border-red-500/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {previewLogo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={chiudiPreview}
        >
          <div
            className="bg-[#112240] border border-white/10 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={chiudiPreview}
              className="absolute top-4 right-4 text-[#4e6585] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center justify-center bg-[#1a3060] rounded-xl p-8 mb-4 min-h-48">
              {previewLogo.file ? (
                <img
                  src={previewLogo.file}
                  alt={previewLogo.nome}
                  className="max-h-64 max-w-full object-contain"
                />
              ) : (
                <Image size={48} className="text-[#4e6585]" />
              )}
            </div>
            <div className="font-semibold text-white">{previewLogo.nome}</div>
            <div className="text-sm text-[#8ba3c7] mt-0.5">{previewLogo.tipo}</div>
            <div className="text-xs text-[#4e6585] mt-1">{formatData(previewLogo.createdAt)}</div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => avviaReplacement(previewLogo.id)}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 border border-white/10 rounded-lg py-2 text-sm text-[#8ba3c7] hover:border-blue-500/40 hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                {uploading && replacingId === previewLogo.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                Sostituisci
              </button>
              <button
                onClick={() => { setDeletingId(previewLogo.id); chiudiPreview(); setErrore(null); }}
                className="flex items-center justify-center gap-2 border border-red-500/30 rounded-lg py-2 px-4 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog eliminazione */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#112240] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Elimina logo</h2>
                <p className="text-sm text-[#8ba3c7]">
                  {loghi.find((l) => l.id === deletingId)?.nome}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#8ba3c7] mb-4">
              Questa azione è irreversibile. Il logo sarà rimosso dalla libreria.
            </p>

            {errore && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {errore}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingId(null); setErrore(null); }}
                className="flex-1 border border-white/10 rounded-lg py-2 text-sm text-[#8ba3c7] hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confermaElimina}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                {deleting ? "Eliminazione..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
