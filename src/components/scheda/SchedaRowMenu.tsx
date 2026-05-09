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
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

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
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="p-1.5 rounded hover:bg-white/[0.05] text-[#4e6585] hover:text-[#8ba3c7] transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
          className="w-40 bg-[#112240] border border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          <button
            onClick={() => router.push(`/schede/${id}`)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e8edf4] hover:bg-white/[0.03]"
          >
            <ExternalLink size={14} /> Apri
          </button>
          <button
            onClick={duplica}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e8edf4] hover:bg-white/[0.03]"
          >
            <Copy size={14} /> Duplica
          </button>
          <button
            onClick={elimina}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Elimina
          </button>
        </div>
      )}
    </>
  );
}
