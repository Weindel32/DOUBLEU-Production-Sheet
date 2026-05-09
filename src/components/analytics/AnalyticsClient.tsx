"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Printer } from "lucide-react";
import type { AnalyticsData } from "@/app/(dashboard)/analytics/page";

const SIZE_ORDER = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "4A", "6A", "8A", "10A", "12A", "14A", "16A",
];

const GENERE_COLORS: Record<string, string> = {
  uomo: "#3b82f6",
  donna: "#ec4899",
  junior: "#22c55e",
  unisex: "#a855f7",
};

const GENERE_TABS = [
  { value: "tutti", label: "Tutti" },
  { value: "uomo", label: "Uomo" },
  { value: "donna", label: "Donna" },
  { value: "junior", label: "Junior" },
  { value: "unisex", label: "Unisex" },
];

function FilterTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap print:hidden">
      {GENERE_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === tab.value
              ? "bg-blue-600 text-white"
              : "text-[#8ba3c7] hover:text-white hover:bg-white/5"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ArticoloTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { codice: string; nomeArticolo: string; totalePezzi: number; percentuale: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a2332] border border-white/10 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-semibold">{d.codice}</p>
      <p className="text-[#8ba3c7] text-xs mb-2">{d.nomeArticolo}</p>
      <p className="text-white">
        {d.totalePezzi.toLocaleString("it-IT")}{" "}
        <span className="text-[#8ba3c7]">pz</span>
      </p>
      <p className="text-[#8ba3c7] text-xs">{d.percentuale}% del totale</p>
    </div>
  );
}

function TagliaTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { taglia: string; pezzi: number; percentuale: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a2332] border border-white/10 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-semibold">Taglia {d.taglia}</p>
      <p className="text-white">
        {d.pezzi.toLocaleString("it-IT")}{" "}
        <span className="text-[#8ba3c7]">pz</span>
      </p>
      <p className="text-[#8ba3c7] text-xs">{d.percentuale}% del totale</p>
    </div>
  );
}

export default function AnalyticsClient({
  articoli,
  taglie,
  totali,
}: AnalyticsData) {
  const [filtroArticoli, setFiltroArticoli] = useState("tutti");
  const [filtroTaglie, setFiltroTaglie] = useState("tutti");
  const [activeArticoloIndex, setActiveArticoloIndex] = useState<number | null>(null);
  const [activeTagliaIndex, setActiveTagliaIndex] = useState<number | null>(null);

  const articoliFiltrati = useMemo(() => {
    const filtered =
      filtroArticoli === "tutti"
        ? articoli
        : articoli.filter(
            (a) => (a.genere || "").toLowerCase() === filtroArticoli
          );
    const totPezzi = filtered.reduce((s, a) => s + a.totalePezzi, 0);
    return filtered
      .map((a) => ({
        ...a,
        percentuale:
          totPezzi > 0 ? Math.round((a.totalePezzi / totPezzi) * 100) : 0,
      }))
      .sort((a, b) => b.totalePezzi - a.totalePezzi);
  }, [articoli, filtroArticoli]);

  const top10 = useMemo(() => articoliFiltrati.slice(0, 10), [articoliFiltrati]);

  const taglieData = useMemo(() => {
    const raw =
      (taglie[filtroTaglie as keyof typeof taglie] as Record<string, number>) ||
      {};
    const totTaglie = Object.values(raw).reduce((s, q) => s + q, 0);
    return SIZE_ORDER.filter((t) => (raw[t] || 0) > 0).map((t) => ({
      taglia: t,
      pezzi: raw[t] || 0,
      percentuale:
        totTaglie > 0 ? Math.round(((raw[t] || 0) / totTaglie) * 100) : 0,
    }));
  }, [taglie, filtroTaglie]);

  const barHeight = Math.max(280, top10.length * 48);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Produzione</h1>
          <p className="text-sm text-[#8ba3c7] mt-0.5">
            Solo schede in stato esecutiva
          </p>
        </div>
        <button
          onClick={() => {
            const main = document.querySelector("main") as HTMLElement | null;
            const wrap = main?.parentElement as HTMLElement | null;
            const savedMain = main?.style.cssText ?? "";
            const savedWrap = wrap?.style.cssText ?? "";
            if (main) {
              main.style.overflow = "visible";
              main.style.height = "auto";
              main.style.flex = "none";
              main.style.display = "block";
              main.style.width = "100%";
            }
            if (wrap) {
              wrap.style.display = "block";
              wrap.style.height = "auto";
              wrap.style.minHeight = "0";
            }
            const restore = () => {
              if (main) main.style.cssText = savedMain;
              if (wrap) wrap.style.cssText = savedWrap;
              window.removeEventListener("afterprint", restore);
            };
            window.addEventListener("afterprint", restore);
            window.print();
          }}
          className="print:hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#8ba3c7] hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
        >
          <Printer size={15} />
          Stampa / PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card py-4 text-center sm:col-span-1 col-span-2">
          <div className="text-3xl font-bold text-white">
            {totali.totPezzi.toLocaleString("it-IT")}
          </div>
          <div className="text-[10px] text-[#8ba3c7] uppercase tracking-wider mt-1">
            Pezzi totali
          </div>
          <div className="text-xs text-[#4e6585] mt-0.5">
            {totali.totSchede} schede
          </div>
        </div>
        {(["uomo", "donna", "junior", "unisex"] as const).map((g) => (
          <div key={g} className="card py-4 text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: GENERE_COLORS[g] }}
            >
              {(totali.perGenere[g] || 0).toLocaleString("it-IT")}
            </div>
            <div className="text-[10px] text-[#8ba3c7] uppercase tracking-wider mt-1">
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </div>
            <div className="text-xs text-[#4e6585] mt-0.5">
              {totali.totPezzi > 0
                ? Math.round(
                    ((totali.perGenere[g] || 0) / totali.totPezzi) * 100
                  )
                : 0}
              %
            </div>
          </div>
        ))}
      </div>

      {/* Articles Section */}
      <div className="card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            Top Articoli per Produzione
          </h2>
          <FilterTabs value={filtroArticoli} onChange={setFiltroArticoli} />
        </div>

        {articoliFiltrati.length === 0 ? (
          <div className="text-center py-16 text-[#4e6585]">
            Nessun dato disponibile
          </div>
        ) : (
          <>
            <div style={{ height: barHeight, overflow: "hidden" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={top10}
                  margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#8ba3c7", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                    tickFormatter={(v) => v.toLocaleString("it-IT")}
                  />
                  <YAxis
                    type="category"
                    dataKey="codice"
                    tick={{ fill: "#8ba3c7", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<ArticoloTooltip />} cursor={false} />
                  <Bar
                    dataKey="totalePezzi"
                    radius={[0, 4, 4, 0]}
                    onMouseEnter={(_, index) => setActiveArticoloIndex(index)}
                    onMouseLeave={() => setActiveArticoloIndex(null)}
                    label={{
                      position: "right",
                      fill: "#8ba3c7",
                      fontSize: 11,
                      formatter: (v: unknown) =>
                        `${Number(v).toLocaleString("it-IT")} pz`,
                    }}
                  >
                    {top10.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          GENERE_COLORS[(entry.genere || "").toLowerCase()] ||
                          "#3b82f6"
                        }
                        fillOpacity={
                          activeArticoloIndex === null || activeArticoloIndex === i
                            ? 0.9
                            : 0.35
                        }
                        style={{ transition: "fill-opacity 0.15s" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap print:hidden">
              {Object.entries(GENERE_COLORS).map(([g, color]) => (
                <div key={g} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: color, opacity: 0.9 }}
                  />
                  <span className="text-xs text-[#8ba3c7] capitalize">{g}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["#", "Codice", "Articolo", "Genere", "Pezzi", "%"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-2 px-3 text-[#8ba3c7] text-xs font-medium uppercase tracking-wider ${
                            i >= 4 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {articoliFiltrati.map((a, i) => (
                    <tr
                      key={a.codice}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-[#4e6585] text-xs">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#8ba3c7]">
                        {a.codice}
                      </td>
                      <td className="py-2.5 px-3 text-white">{a.nomeArticolo}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${GENERE_COLORS[(a.genere || "").toLowerCase()]}25`,
                            color:
                              GENERE_COLORS[(a.genere || "").toLowerCase()] ||
                              "#8ba3c7",
                          }}
                        >
                          {a.genere || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white font-medium">
                        {a.totalePezzi.toLocaleString("it-IT")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8ba3c7]">
                        {a.percentuale}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Sizes Section */}
      <div className="card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            Distribuzione Taglie
          </h2>
          <FilterTabs value={filtroTaglie} onChange={setFiltroTaglie} />
        </div>

        {taglieData.length === 0 ? (
          <div className="text-center py-16 text-[#4e6585]">
            Nessun dato disponibile
          </div>
        ) : (
          <>
            <div style={{ height: 280, overflow: "hidden" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={taglieData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="taglia"
                    tick={{ fill: "#8ba3c7", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8ba3c7", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.toLocaleString("it-IT")}
                  />
                  <Tooltip content={<TagliaTooltip />} cursor={false} />
                  <Bar
                    dataKey="pezzi"
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(_, index) => setActiveTagliaIndex(index)}
                    onMouseLeave={() => setActiveTagliaIndex(null)}
                    label={{
                      position: "top",
                      fill: "#8ba3c7",
                      fontSize: 10,
                      formatter: (v: unknown) => Number(v).toLocaleString("it-IT"),
                    }}
                  >
                    {taglieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill="#3b82f6"
                        fillOpacity={
                          activeTagliaIndex === null || activeTagliaIndex === i
                            ? 0.9
                            : 0.35
                        }
                        style={{ transition: "fill-opacity 0.15s" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-[#8ba3c7] text-xs font-medium uppercase tracking-wider">
                      Taglia
                    </th>
                    <th className="text-right py-2 px-3 text-[#8ba3c7] text-xs font-medium uppercase tracking-wider">
                      Pezzi
                    </th>
                    <th className="text-right py-2 px-3 text-[#8ba3c7] text-xs font-medium uppercase tracking-wider">
                      %
                    </th>
                    <th className="py-2 px-3 text-[#8ba3c7] text-xs font-medium uppercase tracking-wider">
                      Distribuzione
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {taglieData.map((t) => (
                    <tr
                      key={t.taglia}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-white">
                        {t.taglia}
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {t.pezzi.toLocaleString("it-IT")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8ba3c7]">
                        {t.percentuale}%
                      </td>
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${t.percentuale}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
