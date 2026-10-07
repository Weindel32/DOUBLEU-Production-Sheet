-- Collegamento all'anagrafica clienti dell'Order App (sola lettura da questa app).
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "orderAppId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "citta" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_orderAppId_key" ON "Cliente"("orderAppId");
