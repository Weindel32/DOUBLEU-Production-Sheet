-- Spese reali di un ordine per fase (consuntivo) e chiusura del consuntivo.
CREATE TABLE IF NOT EXISTS "SpesaOrdine" (
  "id" TEXT PRIMARY KEY,
  "ordineOrderAppId" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "fase" TEXT NOT NULL,
  "fornitore" TEXT,
  "descrizione" TEXT,
  "importo" DOUBLE PRECISION NOT NULL,
  "fattura" BOOLEAN NOT NULL DEFAULT true,
  "iva" DOUBLE PRECISION,
  "riferimento" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SpesaOrdine_ordineOrderAppId_idx" ON "SpesaOrdine"("ordineOrderAppId");
ALTER TABLE "SpesaOrdine" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "ConsuntivoOrdine" (
  "ordineOrderAppId" TEXT PRIMARY KEY,
  "chiusoIl" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "ConsuntivoOrdine" ENABLE ROW LEVEL SECURITY;
