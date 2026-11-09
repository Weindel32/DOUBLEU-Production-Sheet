-- Avanzamento della produzione per scheda: {fase: "aaaa-mm-gg" | "salta"}.
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "fasi" TEXT;
