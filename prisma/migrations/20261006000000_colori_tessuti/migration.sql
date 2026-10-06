-- Colori disponibili per tessuto: codici del fornitore sul materiale, nomi in una tabella per fornitore.
ALTER TABLE "Materiale" ADD COLUMN IF NOT EXISTS "colori" TEXT;
ALTER TABLE "Materiale" ADD COLUMN IF NOT EXISTS "cartellaFoto" TEXT;
ALTER TABLE "Materiale" ADD COLUMN IF NOT EXISTS "cartellaData" TEXT;
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "coloreBaseCodice" TEXT;
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "coloriSecondariCodice" TEXT;

CREATE TABLE IF NOT EXISTS "ColoreFornitore" (
  "id" TEXT NOT NULL,
  "fornitore" TEXT NOT NULL,
  "codice" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "hex" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ColoreFornitore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ColoreFornitore_fornitore_codice_key" ON "ColoreFornitore"("fornitore", "codice");
ALTER TABLE "ColoreFornitore" ENABLE ROW LEVEL SECURITY;
