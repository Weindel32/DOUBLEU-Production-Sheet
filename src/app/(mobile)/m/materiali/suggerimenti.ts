const COMPOSIZIONI_BASE = [
  "100% Cotone", "100% Poliestere", "100% Poliammide", "60% CO 40% PL", "50% CO 50% PL", "80% CO 20% PL",
  "90% Poliammide 10% Elastane", "80% Poliammide 20% Elastane", "85% Poliestere 15% Elastane", "95% CO 5% Elastane",
];

/** Fornitori e composizioni già usati, per completare i campi con un tocco. */
export function suggerimentiMateriali(materiali: { fornitore: string | null; composizione: string | null }[]) {
  const unici = (v: (string | null)[]) => [...new Set(v.filter((x): x is string => !!x && !!x.trim()))].sort((a, b) => a.localeCompare(b));
  return {
    fornitori: unici(materiali.map((m) => m.fornitore)),
    composizioni: unici([...COMPOSIZIONI_BASE, ...materiali.map((m) => m.composizione)]),
  };
}
