"use client";

import { useRouter } from "next/navigation";

type Modello = { codice: string; descrizione: string; fascia: string };
type Categoria = { nome: string; articoli: Modello[] };

const CATALOGO: Categoria[] = [
  {
    nome: "T-Shirt PRF",
    articoli: [
      { codice: "DUSP 09", descrizione: "T-Shirt PRF", fascia: "Uomo" },
      { codice: "DUSP 19", descrizione: "T-Shirt PRF", fascia: "Kids" },
      { codice: "DUSP 013", descrizione: "T-Shirt Raglan", fascia: "Adulto" },
      { codice: "DUSP 207", descrizione: "T-Shirt 3 col.", fascia: "Adulto" },
      { codice: "DUSP 014", descrizione: "T-Shirt 3 col.", fascia: "Kids" },
      { codice: "DUSP 215", descrizione: "T-Shirt CLLG", fascia: "Adulto" },
      { codice: "DUSP 216-V", descrizione: "T-Shirt collo V", fascia: "Adulto" },
    ],
  },
  {
    nome: "T-Shirt WS",
    articoli: [
      { codice: "DUSP 011", descrizione: "T-Shirt Ws micro", fascia: "Donna" },
      { codice: "DUSP 38", descrizione: "T-Shirt Ws micro", fascia: "Kids" },
      { codice: "DUSP 140", descrizione: "Canotta Ws", fascia: "Donna" },
    ],
  },
  {
    nome: "T-Shirt COT",
    articoli: [
      { codice: "DUSP 31", descrizione: "T-Shirt Cot", fascia: "Adulto" },
      { codice: "DUSP 32", descrizione: "T-Shirt Cot", fascia: "Kids" },
      { codice: "DUSP 27", descrizione: "T-Shirt Hoodie", fascia: "Adulto" },
      { codice: "DUSP 27B", descrizione: "T-Shirt Hoodie", fascia: "Kids" },
    ],
  },
  {
    nome: "Polo",
    articoli: [
      { codice: "DUSP 139", descrizione: "Polo senza bottoni", fascia: "Adulto" },
    ],
  },
  {
    nome: "Hoodie",
    articoli: [
      { codice: "DUSP 01", descrizione: "Hoodie GM", fascia: "Adulto" },
      { codice: "DUSP 04", descrizione: "Hoodie GM", fascia: "Kids" },
      { codice: "DUSP 02", descrizione: "Hoodie Raglan", fascia: "Adulto" },
      { codice: "DUSP 03", descrizione: "Hoodie Raglan", fascia: "Kids" },
      { codice: "DUSP 136", descrizione: "Hoodie 2 col.", fascia: "Adulto" },
      { codice: "DUSP 137", descrizione: "Hoodie 2 col.", fascia: "Kids" },
      { codice: "DUSP M012", descrizione: "Hoodie 3 col.", fascia: "Adulto" },
      { codice: "DUSP M013", descrizione: "Hoodie 3 col.", fascia: "Kids" },
      { codice: "DUSP 206", descrizione: "Hoodie marsupio", fascia: "Adulto" },
      { codice: "DUSP 214", descrizione: "Hoodie SLIT", fascia: "Adulto" },
    ],
  },
  {
    nome: "Zip Hoodie",
    articoli: [
      { codice: "DUSP 24", descrizione: "Zip Hoodie GM", fascia: "Adulto" },
      { codice: "DUSP 216", descrizione: "Zip Hoodie GM", fascia: "Kids" },
      { codice: "DUSP 25", descrizione: "Zip Hoodie Raglan", fascia: "Adulto" },
      { codice: "DUSP 210", descrizione: "Zip Hoodie Raglan", fascia: "Kids" },
      { codice: "DUSP 26", descrizione: "Zip Hoodie 3 col.", fascia: "Adulto" },
      { codice: "DUSP 29", descrizione: "Zip Hoodie 3 col.", fascia: "Kids" },
      { codice: "DUSP 22", descrizione: "Zip Hoodie RL", fascia: "Adulto" },
      { codice: "DUSP 28", descrizione: "Zip Hoodie CLLG", fascia: "Adulto" },
      { codice: "DUSP 30", descrizione: "Zip Hoodie", fascia: "Donna" },
      { codice: "DUSP 209", descrizione: "Zip Hoodie Three", fascia: "Adulto" },
    ],
  },
  {
    nome: "Sweatshirt",
    articoli: [
      { codice: "DUSP 20", descrizione: "Sweatshirt Raglan", fascia: "Adulto" },
      { codice: "DUSP 211", descrizione: "Sweatshirt Raglan", fascia: "Kids" },
      { codice: "DUSP 202", descrizione: "Sweatshirt 2 col. R-arm", fascia: "Adulto" },
      { codice: "DUSP 203", descrizione: "Sweatshirt 2 col. R-arm", fascia: "Kids" },
      { codice: "DUSP 138", descrizione: "Sweatshirt Large Stripe", fascia: "Adulto" },
      { codice: "DUSP 217", descrizione: "Sweatshirt", fascia: "Donna" },
      { codice: "DUSP M15", descrizione: "Sweatshirt triangolino", fascia: "Adulto" },
    ],
  },
  {
    nome: "Sweatpants",
    articoli: [
      { codice: "DUSP 05", descrizione: "Sweatpants", fascia: "Adulto" },
      { codice: "DUSP 07", descrizione: "Sweatpants", fascia: "Kids" },
      { codice: "DUSP 201", descrizione: "Sweatpants 3 col.", fascia: "Adulto" },
      { codice: "DUSP 204", descrizione: "Sweatpants 2 col.", fascia: "Kids" },
    ],
  },
  {
    nome: "Short",
    articoli: [
      { codice: "DUSP 33", descrizione: "Short cotone", fascia: "Uomo" },
      { codice: "DUSP 39", descrizione: "Short cotone", fascia: "Kids" },
      { codice: "DUSP 08", descrizione: "Short stripe", fascia: "Uomo" },
      { codice: "DUSP 014-S", descrizione: "Short stripe", fascia: "Kids" },
      { codice: "DUSP 18", descrizione: "Short cotone", fascia: "Donna" },
      { codice: "DUSP 34", descrizione: "Short DDR", fascia: "Donna" },
      { codice: "DUSP 212", descrizione: "Short WDL", fascia: "Adulto" },
      { codice: "DUSP 213", descrizione: "Short SLIT", fascia: "Uomo" },
      { codice: "DUSP 200", descrizione: "Short triangolo", fascia: "Uomo" },
      { codice: "DUSP 205", descrizione: "Short triangolo", fascia: "Kids" },
    ],
  },
  {
    nome: "Skirt",
    articoli: [
      { codice: "DUSP 13", descrizione: "Skirt", fascia: "Adulto" },
      { codice: "DUSP 17", descrizione: "Skirt", fascia: "Kids" },
    ],
  },
  {
    nome: "Dress",
    articoli: [
      { codice: "DUSP 010", descrizione: "Vestitino Ws", fascia: "Donna" },
      { codice: "DUSP 014-D", descrizione: "Completino", fascia: "Kids" },
      { codice: "DUSP 208", descrizione: "Vestitino", fascia: "Kids" },
    ],
  },
];

const FASCIA_STYLE: Record<string, string> = {
  Adulto: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Uomo:   "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20",
  Donna:  "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  Kids:   "bg-orange-500/15 text-orange-300 border border-orange-500/20",
};

export default function ModelliPage() {
  const router = useRouter();

  const creaScheda = (m: Modello, categoria: string) => {
    const params = new URLSearchParams({
      codice: m.codice,
      nome: m.descrizione,
      categoria,
      fascia: m.fascia,
    });
    router.push(`/schede/nuova?${params.toString()}`);
  };

  const totale = CATALOGO.reduce((s, c) => s + c.articoli.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Modelli base</h1>
        <p className="text-sm text-[#8ba3c7] mt-0.5">
          Catalogo DUSP — {totale} articoli · Rev. Aprile 2026
        </p>
      </div>

      <div className="space-y-4">
        {CATALOGO.map((cat) => (
          <div key={cat.nome} className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/7 bg-white/[0.03]">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-[#8ba3c7]">{cat.nome}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-[#4e6585] uppercase tracking-wide">Codice</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-[#4e6585] uppercase tracking-wide">Descrizione</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-[#4e6585] uppercase tracking-wide">Fascia</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {cat.articoli.map((m) => (
                  <tr key={m.codice} className="border-b border-white/5 hover:bg-white/[0.03] group transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#8ba3c7]">{m.codice}</td>
                    <td className="px-4 py-2.5 text-white">{m.descrizione}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FASCIA_STYLE[m.fascia] ?? "bg-white/10 text-[#8ba3c7]"}`}>
                        {m.fascia}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => creaScheda(m, cat.nome)}
                        className="text-xs text-blue-400 font-medium transition-opacity hover:text-blue-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                      >
                        Usa modello →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
