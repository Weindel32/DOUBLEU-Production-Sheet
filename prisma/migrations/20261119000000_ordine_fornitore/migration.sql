-- Ordine al fornitore dei capi comprati già fatti (linea LS24): quando ordinati e quando arrivati.
CREATE TABLE IF NOT EXISTS "OrdineFornitore" (
  "ordineOrderAppId" TEXT NOT NULL,
  "ordinatoIl" TEXT,
  "arrivatoIl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdineFornitore_pkey" PRIMARY KEY ("ordineOrderAppId")
);
ALTER TABLE "OrdineFornitore" ENABLE ROW LEVEL SECURITY;
