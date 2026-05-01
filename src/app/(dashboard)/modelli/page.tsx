import { BookOpen } from "lucide-react";

export default function ModelliPage() {
  const modelli = [
    { nome: "T-Shirt Base", categoria: "T-Shirt", vestibilita: "Regular Fit", tessuto: "100% Poliestere, 140 g/m²" },
    { nome: "Felpa Allenamento", categoria: "Felpa", vestibilita: "Regular Fit", tessuto: "80% Cotone, 20% Poliestere" },
    { nome: "Pantaloncino Gara", categoria: "Pantaloncino", vestibilita: "Athletic Fit", tessuto: "100% Poliestere, 120 g/m²" },
    { nome: "Polo Club", categoria: "Polo", vestibilita: "Regular Fit", tessuto: "100% Poliestere, 160 g/m²" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Modelli base</h1>
        <p className="text-sm text-gray-500 mt-0.5">Template predefiniti per avviare nuove schede rapidamente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelli.map((m) => (
          <div key={m.nome} className="card hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen size={18} className="text-blue-600" />
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{m.categoria}</span>
            </div>
            <div className="font-semibold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">{m.nome}</div>
            <div className="text-sm text-gray-500 mb-0.5">{m.vestibilita}</div>
            <div className="text-xs text-gray-400">{m.tessuto}</div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-blue-600 font-medium">Usa questo modello →</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-2 border-dashed border-gray-200 text-center py-8">
        <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-gray-400 text-sm">I modelli personalizzati saranno disponibili presto</p>
      </div>
    </div>
  );
}
