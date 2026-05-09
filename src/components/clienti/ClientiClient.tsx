"use client";

import { useState } from "react";
import { Users, PlusCircle, Pencil, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatData } from "@/lib/utils";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefono: string | null;
  indirizzo: string | null;
  note: string | null;
  createdAt: Date | string;
  _count: { schede: number };
}

interface Props {
  clientiIniziali: Cliente[];
}

interface FormState {
  nome: string;
  email: string;
  telefono: string;
  indirizzo: string;
  note: string;
}

const FORM_VUOTO: FormState = { nome: "", email: "", telefono: "", indirizzo: "", note: "" };

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500",
  "bg-cyan-500", "bg-rose-500", "bg-amber-500", "bg-teal-500",
];

function avatarColor(nome: string) {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ClientiClient({ clientiIniziali }: Props) {
  const [clienti, setClienti] = useState<Cliente[]>(clientiIniziali);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VUOTO);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const apriEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({
      nome: c.nome,
      email: c.email || "",
      telefono: c.telefono || "",
      indirizzo: c.indirizzo || "",
      note: c.note || "",
    });
    setErrore(null);
  };

  const chiudiEdit = () => {
    setEditingCliente(null);
    setForm(FORM_VUOTO);
    setErrore(null);
  };

  const salvaEdit = async () => {
    if (!editingCliente || !form.nome.trim()) return;
    setSaving(true);
    setErrore(null);
    try {
      const res = await fetch(`/api/clienti/${editingCliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      const aggiornato = await res.json();
      setClienti((prev) =>
        prev.map((c) =>
          c.id === editingCliente.id ? { ...c, ...aggiornato } : c
        )
      );
      chiudiEdit();
    } catch {
      setErrore("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const confermaElimina = async () => {
    if (!deletingId) return;
    setDeleting(true);
    setErrore(null);
    try {
      const res = await fetch(`/api/clienti/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErrore(data.error || "Errore nell'eliminazione");
        return;
      }
      setClienti((prev) => prev.filter((c) => c.id !== deletingId));
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
          <h1 className="text-2xl font-bold text-white">Clienti / Club</h1>
          <p className="text-sm text-[#8ba3c7] mt-0.5">{clienti.length} clienti registrati</p>
        </div>
        <Link
          href="/clienti/nuovo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Nuovo cliente
        </Link>
      </div>

      {clienti.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="mx-auto mb-4 text-[#4e6585]" />
          <h2 className="text-[#8ba3c7] font-medium mb-2">Nessun cliente</h2>
          <p className="text-[#4e6585] text-sm mb-4">Aggiungi il primo cliente o club sportivo</p>
          <Link
            href="/clienti/nuovo"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            <PlusCircle size={16} />
            Nuovo cliente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clienti.map((c) => (
            <div key={c.id} className="card hover:bg-[#162a4e] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${avatarColor(c.nome)} flex items-center justify-center font-bold text-sm text-white`}>
                  {c.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#4e6585] mr-2">{c._count.schede} schede</span>
                  <button
                    onClick={() => apriEdit(c)}
                    className="p-1.5 text-[#4e6585] hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                    title="Modifica cliente"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { setDeletingId(c.id); setErrore(null); }}
                    className="p-1.5 text-[#4e6585] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Elimina cliente"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="font-semibold text-white mb-1">{c.nome}</div>
              {c.email && <div className="text-sm text-[#8ba3c7]">{c.email}</div>}
              {c.telefono && <div className="text-sm text-[#8ba3c7]">{c.telefono}</div>}
              {c.indirizzo && <div className="text-xs text-[#4e6585] mt-1">{c.indirizzo}</div>}
              <div className="text-xs text-[#4e6585] mt-2">Aggiunto il {formatData(c.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal modifica */}
      {editingCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#112240] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Modifica cliente</h2>
              <button onClick={chiudiEdit} className="text-[#4e6585] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "Nome *", field: "nome" },
                { label: "Email", field: "email" },
                { label: "Telefono", field: "telefono" },
                { label: "Indirizzo", field: "indirizzo" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs text-[#8ba3c7] mb-1">{label}</label>
                  <input
                    type="text"
                    value={form[field as keyof FormState]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-[#1a3060] focus:border-blue-500/50 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1">Note</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-[#1a3060] focus:border-blue-500/50 outline-none resize-none"
                />
              </div>
            </div>

            {errore && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {errore}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={chiudiEdit}
                className="flex-1 border border-white/10 rounded-lg py-2 text-sm text-[#8ba3c7] hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={salvaEdit}
                disabled={saving || !form.nome.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog conferma eliminazione */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#112240] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Elimina cliente</h2>
                <p className="text-sm text-[#8ba3c7]">
                  {clienti.find((c) => c.id === deletingId)?.nome}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#8ba3c7] mb-4">
              Questa azione è irreversibile. Il cliente sarà eliminato permanentemente.
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
