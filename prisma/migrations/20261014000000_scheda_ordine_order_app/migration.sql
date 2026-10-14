-- Ordine dell'Order App a cui appartiene la scheda: l'elenco raggruppa le referenze per ordine.
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "ordineOrderAppId" TEXT;
CREATE INDEX IF NOT EXISTS "Scheda_ordineOrderAppId_idx" ON "Scheda"("ordineOrderAppId");
