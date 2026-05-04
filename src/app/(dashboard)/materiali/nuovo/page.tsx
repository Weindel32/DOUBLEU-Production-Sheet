"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const TIPI = ["Tessuto", "Fodera", "Elastico", "Cerniera", "Bottoni", "Ricamo", "Stampa", "Altro"];
const COMPOSIZIONI = [
  "100% Cotone",
  "100% Poliestere",
  "100% Poliammide",
  "60% CO 40% PL",
  "60% Cotone 40% Poliestere",
  "50% CO 50% PL",
  "80% CO 20% PL",
  "90% Poliammide 10% Elastane",
  "80% Poliammide 20% Elastane",
  "85% Poliestere 15% Elastane",
  "95% CO 5% Elastane",
];

export default function NuovoMaterialePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "",
    composizione: "",
    peso: "",
    unitaPeso: "g/m²",
    larghezza: "",
    unitaMisura: "metro",
    fornitore: "",
    costoMetro: "",
    note: "",
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/materiali", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costoMetro: form.costoMetro ? parseFloat(form.costoMetro) : null,
      }),
    });
    router.push("/materiali");
  };

  return (
    <div className="p-6 max-w-xl">
      <Link href="/materiali" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={16} />
        Torna ai materiali
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Aggiungi materiale</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Nome *</label>
          <input
            required
            type="text"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="es. Jersey Tecnico"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Tipo *</label>
            <select
              required
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            >
              <option value="">Seleziona</option>
              {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Composizione</label>
            <input
              type="text"
              list="composizioni-suggerimenti"
              value={form.composizione}
              onChange={(e) => set("composizione", e.target.value)}
              placeholder="es. 60% CO 40% PL"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
            <datalist id="composizioni-suggerimenti">
              {COMPOSIZIONI.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Unità di misura costo</label>
            <select
              value={form.unitaMisura}
              onChange={(e) => set("unitaMisura", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            >
              <option value="metro">Al metro (€/m)</option>
              <option value="kg">Al kg (€/kg)</option>
              <option value="pz">Al pezzo (€/pz)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              {form.unitaMisura === "kg" ? "Costo al kg (€)" : form.unitaMisura === "pz" ? "Costo al pezzo (€)" : "Costo al metro (€)"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costoMetro}
              onChange={(e) => set("costoMetro", e.target.value)}
              placeholder="es. 4.50"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Unità peso</label>
            <select
              value={form.unitaPeso}
              onChange={(e) => set("unitaPeso", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            >
              <option value="g/m²">g/m² (al mq)</option>
              <option value="g/m">g/m (GR MTL)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Peso ({form.unitaPeso})</label>
            <input
              type="text"
              value={form.peso}
              onChange={(e) => set("peso", e.target.value)}
              placeholder={form.unitaPeso === "g/m" ? "es. 635" : "es. 180"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
            {form.unitaPeso === "g/m" && parseFloat(form.peso.replace(",", ".")) > 0 && (
              <p className="text-xs text-blue-500 mt-1">→ {(1000 / parseFloat(form.peso.replace(",", "."))).toFixed(3)} m/kg</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Altezza tessuto - Alt. (cm)</label>
            <input
              type="text"
              value={form.larghezza}
              onChange={(e) => set("larghezza", e.target.value)}
              placeholder="es. 150"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Fornitore</label>
          <input
            type="text"
            value={form.fornitore}
            onChange={(e) => set("fornitore", e.target.value)}
            placeholder="es. Eurojersey"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            placeholder="Note aggiuntive..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/materiali"
            className="flex-1 text-center border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !form.nome || !form.tipo}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Salva materiale"}
          </button>
        </div>
      </form>
    </div>
  );
}
