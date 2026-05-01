import { Settings } from "lucide-react";

export default function ImpostazioniPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Impostazioni</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configurazione del gestionale</p>
      </div>

      <div className="card max-w-lg">
        <h2 className="font-semibold text-gray-700 mb-4">Azienda</h2>
        <div className="space-y-3">
          {[
            { label: "Nome azienda", value: "Double U" },
            { label: "Sottotitolo", value: "Handcrafted in Italy" },
            { label: "Email", value: "" },
            { label: "Telefono", value: "" },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="text-sm text-gray-600 block mb-1">{label}</label>
              <input
                type="text"
                defaultValue={value}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 outline-none"
              />
            </div>
          ))}
        </div>
        <button className="mt-4 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
          Salva impostazioni
        </button>
      </div>
    </div>
  );
}
