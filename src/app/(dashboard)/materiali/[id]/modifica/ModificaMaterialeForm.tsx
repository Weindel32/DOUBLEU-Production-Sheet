"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calcolaCostoAlMetro, calcolaGrammiMq } from "@/lib/utils";

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

type Materiale = {
  id: string;
  nome: string;
  tipo: string;
  composizione: string | null;
  peso: string | null;
  unitaPeso: string | null;
  larghezza: string | null;
  unitaMisura: string | null;
  fornitore: string | null;
  costoMetro: number | null;
  note: string | null;
};

export default function ModificaMaterialeForm({ materiale }: { materiale: Materiale }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: materiale.nome,
    tipo: materiale.tipo,
    composizione: materiale.composizione ?? "",
    peso: materiale.peso ?? "",
    unitaPeso: materiale.unitaPeso ?? "g/m²",
    larghezza: materiale.larghezza ?? "",
    unitaMisura: materiale.unitaMisura ?? "metro",
    fornitore: materiale.fornitore ?? "",
    costoMetro: materiale.costoMetro?.toString() ?? "",
    note: materiale.note ?? "",
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const pesoNum = parseFloat(form.peso.replace(",", ".")) || 0;
  const costoAlMetro = form.unitaMisura === "kg"
    ? calcolaCostoAlMetro({
        costoMetro: parseFloat(form.costoMetro.replace(",", ".")) || null,
        unitaMisura: form.unitaMisura,
        peso: form.peso,
        unitaPeso: form.unitaPeso,
        larghezza: form.larghezza,
      })
    : null;
  const grammiMq = calcolaGrammiMq({ peso: form.peso, unitaPeso: form.unitaPeso, larghezza: form.larghezza });
  const mostraCalcoli = (form.unitaPeso === "g/m" && pesoNum > 0) || (form.unitaMisura === "kg" && form.costoMetro);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/materiali/${materiale.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costoMetro: form.costoMetro ? parseFloat(form.costoMetro) : null,
      }),
    });
    router.push("/materiali");
    router.refresh();
  };

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/materiali" className="flex items-center gap-2 text-sm text-[#8ba3c7] hover:text-white mb-6">
        <ArrowLeft size={16} />
        Torna ai materiali
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Modifica materiale</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm text-[#8ba3c7] block mb-1">Nome *</label>
          <input
            required
            type="text"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="es. Jersey Tecnico"
            className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-sm text-[#8ba3c7] block mb-1">Tipo *</label>
            <select
              required
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            >
              <option value="">Seleziona</option>
              {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[#8ba3c7] block mb-1">Composizione</label>
            <input
              type="text"
              list="composizioni-suggerimenti"
              value={form.composizione}
              onChange={(e) => set("composizione", e.target.value)}
              placeholder="es. 60% CO 40% PL"
              className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
            <datalist id="composizioni-suggerimenti">
              {COMPOSIZIONI.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="border-t border-white/8 pt-5">
          <div className="text-xs font-semibold text-[#4e6585] uppercase tracking-wide mb-3">Prezzo</div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm text-[#8ba3c7] block mb-1">Unità di misura costo</label>
              <select
                value={form.unitaMisura}
                onChange={(e) => set("unitaMisura", e.target.value)}
                className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              >
                <option value="metro">Al metro (€/m)</option>
                <option value="kg">Al kg (€/kg)</option>
                <option value="pz">Al pezzo (€/pz)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#8ba3c7] block mb-1">
                {form.unitaMisura === "kg" ? "Costo al kg (€)" : form.unitaMisura === "pz" ? "Costo al pezzo (€)" : "Costo al metro (€)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costoMetro}
                onChange={(e) => set("costoMetro", e.target.value)}
                placeholder="es. 4.50"
                className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 pt-5">
          <div className="text-xs font-semibold text-[#4e6585] uppercase tracking-wide mb-3">Peso e dimensioni tessuto</div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-[#8ba3c7] block mb-1">Unità peso</label>
              <select
                value={form.unitaPeso}
                onChange={(e) => set("unitaPeso", e.target.value)}
                className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              >
                <option value="g/m²">g/m² (al mq)</option>
                <option value="g/m">g/m (GR MTL)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#8ba3c7] block mb-1">Peso ({form.unitaPeso})</label>
              <input
                type="text"
                value={form.peso}
                onChange={(e) => set("peso", e.target.value)}
                placeholder={form.unitaPeso === "g/m" ? "es. 635" : "es. 180"}
                className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-[#8ba3c7] block mb-1">Altezza tessuto - Alt. (cm)</label>
              <input
                type="text"
                value={form.larghezza}
                onChange={(e) => set("larghezza", e.target.value)}
                placeholder="es. 150"
                className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          {mostraCalcoli && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm flex flex-wrap gap-x-8 gap-y-1.5">
              {form.unitaPeso === "g/m" && pesoNum > 0 && (
                <div className="text-blue-300">Equivalenza peso: <strong>{(1000 / pesoNum).toFixed(2)} m/kg</strong></div>
              )}
              {form.unitaPeso === "g/m" && pesoNum > 0 && (
                grammiMq !== null ? (
                  <div className="text-blue-300">Grammatura da comunicare: <strong>{grammiMq.toFixed(0)} g/m²</strong></div>
                ) : (
                  <div className="text-orange-400">Inserisci l&apos;altezza tessuto per ricavare i g/m²</div>
                )
              )}
              {form.unitaMisura === "kg" && form.costoMetro && (
                costoAlMetro !== null ? (
                  <div className="text-blue-300">Costo al metro lineare: <strong>€ {costoAlMetro.toFixed(2)}/m</strong></div>
                ) : (
                  <div className="text-orange-400">Inserisci peso e altezza tessuto per calcolare il costo al metro</div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/8 pt-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#8ba3c7] block mb-1">Fornitore</label>
            <input
              type="text"
              value={form.fornitore}
              onChange={(e) => set("fornitore", e.target.value)}
              placeholder="es. Eurojersey"
              className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-[#8ba3c7] block mb-1">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Note aggiuntive..."
              className="w-full border border-white/15 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/materiali"
            className="flex-1 text-center border border-white/15 text-[#8ba3c7] px-4 py-2 rounded-lg text-sm hover:bg-white/[0.03] transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !form.nome || !form.tipo}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </div>
      </form>
    </div>
  );
}
