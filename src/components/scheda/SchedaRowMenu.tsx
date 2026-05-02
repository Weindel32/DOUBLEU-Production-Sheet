"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, Copy, Trash2 } from "lucide-react";

interface Props {
  id: string;
  nome: string;
}

export default function SchedaRowMenu({ id, nome }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const elimina = async () => {
    setOpen(false);
    if (!confirm(`Eliminare "${nome}"? L'operazione non è reversibile.`)) return;
    await fetch(`/api/schede/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const duplica = async () => {
    setOpen(false);
    const res = await fetch(`/api/schede/${id}`);
    const scheda = await res.json();
    await fetch("/api/schede", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...scheda, nomeArticolo: `${scheda.nomeArticolo} (Copia)`, stato: "bozza" }),
    });
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => router.push(`/schede/${id}`)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink size={14} /> Apri
          </button>
          <button
            onClick={duplica}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy size={14} /> Duplica
          </button>
          <button
            onClick={elimina}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 size={14} /> Elimina
          </button>
        </div>
      )}
    </div>
  );
}
