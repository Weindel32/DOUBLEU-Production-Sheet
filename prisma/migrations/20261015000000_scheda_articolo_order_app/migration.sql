-- Articolo dell'ordine dell'Order App da cui nasce la scheda: nome, capi e taglie arrivano da lì.
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "articoloOrderAppId" TEXT;
