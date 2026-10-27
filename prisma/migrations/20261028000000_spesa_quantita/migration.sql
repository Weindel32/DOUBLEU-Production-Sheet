-- Quantità comprata (facoltativa) sulle spese di tessuto: prezzo medio pagato e confronto col fabbisogno.
ALTER TABLE "SpesaOrdine" ADD COLUMN IF NOT EXISTS "quantita" DOUBLE PRECISION;
ALTER TABLE "SpesaOrdine" ADD COLUMN IF NOT EXISTS "unita" TEXT;
