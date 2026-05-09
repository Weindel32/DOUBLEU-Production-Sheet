"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CATEGORIE } from "@/lib/utils";

function NuovaSchedaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomeArticolo: "",
    categoria: "",
    clienteId: "",
    collezione: "",
    vestibilita: "Regular Fit",
    genere: "Unisex",
  });

  useEffect(() => {
    const codice = searchParams.get("codice");
    const nome = searchParams.get("nome");
    const categoria = searchParams.get("categoria");
    const fascia = searchParams.get("fascia");
    if (nome) {
      setForm((f) => ({
        ...f,
        nomeArticolo: codice ? `${codice} – ${nome}` : nome,
        categoria: categoria || f.categoria,
        genere: fascia === "Kids" ? "Junior" : fascia === "Donna" ? "Donna" : fascia === "Uomo" ? "Uomo" : "Unisex",
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schede", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stato: "bozza", versione: "1.0" }),
      });
      const scheda = await res.json();
      if (!res.ok || !scheda.id) {
        setError(scheda.error || "Errore nella creazione della scheda. Riprova.");
        setLoading(false);
        return;
      }
      router.push(`/schede/${scheda.id}`);
    } catch {
      setError("Errore di rete. Controlla la connessione e riprova.");
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-white bg-[#1a3060] focus:border-blue-500/50 outline-none transition-colors";

  return (
    <div className="p-6 max-w-xl">
      <Link href="/schede" className="flex items-center gap-2 text-sm text-[#8ba3c7] hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} />
        Torna alle schede
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Nuova scheda</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-xs text-[#8ba3c7] uppercase tracking-wider block mb-1.5">Nome articolo *</label>
          <input
            required
            type="text"
            value={form.nomeArticolo}
            onChange={(e) => setForm((f) => ({ ...f, nomeArticolo: e.target.value }))}
            placeholder="es. T-Shirt Training"
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs text-[#8ba3c7] uppercase tracking-wider block mb-1.5">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className={inputCls}
          >
            <option value="">Seleziona categoria</option>
            {CATEGORIE.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#8ba3c7] uppercase tracking-wider block mb-1.5">Collezione</label>
          <input
            type="text"
            value={form.collezione}
            onChange={(e) => setForm((f) => ({ ...f, collezione: e.target.value }))}
            placeholder="es. Training 2024"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#8ba3c7] uppercase tracking-wider block mb-1.5">Vestibilità</label>
            <select
              value={form.vestibilita}
              onChange={(e) => setForm((f) => ({ ...f, vestibilita: e.target.value }))}
              className={inputCls}
            >
              {["Regular Fit", "Slim Fit", "Loose Fit", "Athletic Fit"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8ba3c7] uppercase tracking-wider block mb-1.5">Genere</label>
            <select
              value={form.genere}
              onChange={(e) => setForm((f) => ({ ...f, genere: e.target.value }))}
              className={inputCls}
            >
              {["Unisex", "Uomo", "Donna", "Junior"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/schede"
            className="flex-1 text-center border border-white/10 text-[#8ba3c7] px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !form.nomeArticolo}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Creazione..." : "Crea scheda"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuovaSchedaPage() {
  return (
    <Suspense>
      <NuovaSchedaForm />
    </Suspense>
  );
}
