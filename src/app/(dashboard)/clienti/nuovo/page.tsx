"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", indirizzo: "", note: "" });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/clienti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/clienti");
  };

  return (
    <div className="p-6 max-w-xl">
      <Link href="/clienti" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={16} /> Torna ai clienti
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuovo cliente</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Nome / Club *</label>
          <input required type="text" value={form.nome} onChange={(e) => set("nome", e.target.value)}
            placeholder="es. ASD Atletica Roma"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="es. info@club.it"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Telefono</label>
            <input type="tel" value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
              placeholder="es. +39 06 1234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Indirizzo</label>
          <input type="text" value={form.indirizzo} onChange={(e) => set("indirizzo", e.target.value)}
            placeholder="es. Via Roma 1, 00100 Roma"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none" />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Note</label>
          <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3}
            placeholder="Note aggiuntive..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/clienti" className="flex-1 text-center border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Annulla</Link>
          <button type="submit" disabled={loading || !form.nome}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? "Salvataggio..." : "Salva cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
