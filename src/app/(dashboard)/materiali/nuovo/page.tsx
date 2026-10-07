"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calcolaCostoMetroDaPrezzoKg, calcolaGrammiMq, parseNumIt } from "@/lib/utils";
import SezioneColori from "@/components/materiali/SezioneColori";
import type { NomiTessuto, VoceColore } from "@/lib/colori";

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
    prezzoKg: "",
    note: "",
  });

  const [colori, setColori] = useState({ codici: [] as string[], nomi: {} as NomiTessuto, cartellaFoto: "", cartellaData: "" });
  const [voci, setVoci] = useState<VoceColore[]>([]);
  useEffect(() => {
    fetch("/api/colori-fornitore").then((r) => (r.ok ? r.json() : [])).then(setVoci).catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const pesoNum = parseFloat(form.peso.replace(",", ".")) || 0;
  // Tessuti al kg: il prezzo inserito è €/kg e va in prezzoKg; costoMetro è sempre €/m
  // (kg per metro × prezzo al kg), stessa convenzione del Kit Builder.
  const isKg = form.unitaMisura === "kg";
  const costoAlMetro = isKg
    ? calcolaCostoMetroDaPrezzoKg({
        prezzoKg: parseNumIt(form.prezzoKg),
        peso: form.peso,
        unitaPeso: form.unitaPeso,
        larghezza: form.larghezza,
      })
    : null;
  const grammiMq = calcolaGrammiMq({ peso: form.peso, unitaPeso: form.unitaPeso, larghezza: form.larghezza });
  const mostraCalcoli = (form.unitaPeso === "g/m" && pesoNum > 0) || (isKg && form.prezzoKg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/materiali", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costoMetro: isKg ? costoAlMetro : parseNumIt(form.costoMetro),
        prezzoKg: isKg ? parseNumIt(form.prezzoKg) : null,
        colori: colori.codici, coloriNomi: colori.nomi, cartellaFoto: colori.cartellaFoto || null, cartellaData: colori.cartellaData.trim() || null,
      }),
    });
    router.push("/materiali");
  };

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/materiali" className="flex items-center gap-2 text-sm text-[#4A5566] hover:text-[#0E1B2C] mb-6">
        <ArrowLeft size={16} />
        Torna ai materiali
      </Link>

      <h1 className="text-2xl font-bold text-[#0E1B2C] mb-6">Aggiungi materiale</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm text-[#4A5566] block mb-1">Nome *</label>
          <input
            required
            type="text"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="es. Jersey Tecnico"
            className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-sm text-[#4A5566] block mb-1">Tipo *</label>
            <select
              required
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            >
              <option value="">Seleziona</option>
              {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[#4A5566] block mb-1">Composizione</label>
            <input
              type="text"
              list="composizioni-suggerimenti"
              value={form.composizione}
              onChange={(e) => set("composizione", e.target.value)}
              placeholder="es. 60% CO 40% PL"
              className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
            <datalist id="composizioni-suggerimenti">
              {COMPOSIZIONI.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <div className="border-t border-[#E4E0D6] pt-5">
          <div className="text-xs font-semibold text-[#5F6878] uppercase tracking-wide mb-3">Prezzo</div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm text-[#4A5566] block mb-1">Unità di misura costo</label>
              <select
                value={form.unitaMisura}
                onChange={(e) => set("unitaMisura", e.target.value)}
                className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              >
                <option value="metro">Al metro (€/m)</option>
                <option value="kg">Al kg (€/kg)</option>
                <option value="pz">Al pezzo (€/pz)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#4A5566] block mb-1">
                {isKg ? "Prezzo al kg (€)" : form.unitaMisura === "pz" ? "Costo al pezzo (€)" : "Costo al metro (€)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={isKg ? form.prezzoKg : form.costoMetro}
                onChange={(e) => set(isKg ? "prezzoKg" : "costoMetro", e.target.value)}
                placeholder="es. 4.50"
                className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E4E0D6] pt-5">
          <div className="text-xs font-semibold text-[#5F6878] uppercase tracking-wide mb-3">Peso e dimensioni tessuto</div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-[#4A5566] block mb-1">Unità peso</label>
              <select
                value={form.unitaPeso}
                onChange={(e) => set("unitaPeso", e.target.value)}
                className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              >
                <option value="g/m²">g/m² (al mq)</option>
                <option value="g/m">g/m (GR MTL)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#4A5566] block mb-1">Peso ({form.unitaPeso})</label>
              <input
                type="text"
                value={form.peso}
                onChange={(e) => set("peso", e.target.value)}
                placeholder={form.unitaPeso === "g/m" ? "es. 635" : "es. 180"}
                className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-[#4A5566] block mb-1">Altezza tessuto - Alt. (cm)</label>
              <input
                type="text"
                value={form.larghezza}
                onChange={(e) => set("larghezza", e.target.value)}
                placeholder="es. 150"
                className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          {mostraCalcoli && (
            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm flex flex-wrap gap-x-8 gap-y-1.5">
              {form.unitaPeso === "g/m" && pesoNum > 0 && (
                <div className="text-[#1F3A68]">Equivalenza peso: <strong>{(1000 / pesoNum).toFixed(2)} m/kg</strong></div>
              )}
              {form.unitaPeso === "g/m" && pesoNum > 0 && (
                grammiMq !== null ? (
                  <div className="text-[#1F3A68]">Grammatura commerciale: <strong>{grammiMq.toFixed(0)} g/m²</strong></div>
                ) : (
                  <div className="text-[#A8461F]">Inserisci l&apos;altezza tessuto per ricavare i g/m²</div>
                )
              )}
              {isKg && form.prezzoKg && (
                costoAlMetro !== null ? (
                  <div className="text-[#1F3A68]">Costo al metro lineare: <strong>€ {costoAlMetro.toFixed(2)}/m</strong></div>
                ) : (
                  <div className="text-[#A8461F]">Inserisci peso e altezza tessuto per calcolare il costo al metro (senza, il costo al metro non viene salvato)</div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#E4E0D6] pt-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#4A5566] block mb-1">Fornitore</label>
            <input
              type="text"
              value={form.fornitore}
              onChange={(e) => set("fornitore", e.target.value)}
              placeholder="es. Eurojersey"
              className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-[#4A5566] block mb-1">Note</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Note aggiuntive..."
              className="w-full border border-[#D6D1C4] rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        <div className="border-t border-[#EFEBE2] pt-5">
          <SezioneColori fornitore={form.fornitore} codici={colori.codici} onCodici={(c) => setColori((x) => ({ ...x, codici: c }))}
            voci={voci} onVoce={(v) => setVoci((vs) => [...vs.filter((x) => !(x.fornitore === v.fornitore && x.codice === v.codice)), v])}
            nomi={colori.nomi} onNomi={(n) => setColori((x) => ({ ...x, nomi: n }))}
            cartellaFoto={colori.cartellaFoto} onCartellaFoto={(u) => setColori((x) => ({ ...x, cartellaFoto: u }))}
            cartellaData={colori.cartellaData} onCartellaData={(d) => setColori((x) => ({ ...x, cartellaData: d }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/materiali"
            className="flex-1 text-center border border-[#D6D1C4] text-[#4A5566] px-4 py-2 rounded-lg text-sm hover:bg-[#0E1B2C]/[0.03] transition-colors"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !form.nome || !form.tipo}
            className="flex-1 bg-[#0E1B2C] hover:bg-[#1F3A68] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Salvataggio..." : "Salva materiale"}
          </button>
        </div>
      </form>
    </div>
  );
}
