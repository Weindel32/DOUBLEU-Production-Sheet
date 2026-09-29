"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ExternalLink, Copy, Trash2, CheckCircle, FileEdit } from "lucide-react";
import { STATI_SCHEDA } from "@/lib/utils";

interface Props {
  id: string;
  nome: string;
  statoCorrente: string;
  /** Elenco a cui appartiene la scheda: "/schede" (ordini) o "/articoli" (costi). */
  base?: string;
}

export default function SchedaRowMenu({ id, nome, statoCorrente, base = "/schede" }: Props) {
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

  const cambiaStato = async (nuovoStato: string) => {
    setOpen(false);
    await fetch(`/api/schede/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stato: nuovoStato }),
    });
    router.refresh();
  };

  // Copia lato server: codice nuovo, campi JSON intatti, campioni esclusi.
  const duplica = async () => {
    setOpen(false);
    const res = await fetch(`/api/schede/${id}/copia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modo: "duplica" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      alert(body?.error || "Duplicazione non riuscita");
      return;
    }
    router.refresh();
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={`Azioni per ${nome}`}
        aria-expanded={open}
        className="w-11 h-11 inline-flex items-center justify-center rounded-lg hover:bg-[#0E1B2C]/[0.05] text-[#5F6878] hover:text-[#0E1B2C] transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 50 }}
          className="w-40 bg-[#FFFFFF] border border-[#E4E0D6] rounded-lg shadow-xl overflow-hidden"
        >
          <button
            onClick={() => router.push(`${base}/${id}`)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0E1B2C] hover:bg-[#0E1B2C]/[0.03]"
          >
            <ExternalLink size={14} /> Apri
          </button>
          <div className="border-t border-[#E4E0D6] my-0.5" />
          {STATI_SCHEDA.filter((s) => s.value !== statoCorrente).map((s) => (
            <button
              key={s.value}
              onClick={() => cambiaStato(s.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0E1B2C] hover:bg-[#0E1B2C]/[0.03]"
            >
              {s.value === "esecutiva" ? <CheckCircle size={14} className="text-[#1D6B4A]" /> : <FileEdit size={14} className="text-gray-400" />}
              Segna come {s.label}
            </button>
          ))}
          <div className="border-t border-[#E4E0D6] my-0.5" />
          <button
            onClick={duplica}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0E1B2C] hover:bg-[#0E1B2C]/[0.03]"
          >
            <Copy size={14} /> Duplica
          </button>
          <button
            onClick={elimina}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Elimina
          </button>
        </div>
      )}
    </>
  );
}
