-- Piano di produzione di un ordine dell'Order App: giorni lavorativi e partenza a mano.
CREATE TABLE IF NOT EXISTS "PianoOrdine" (
  "ordineOrderAppId" TEXT PRIMARY KEY,
  "giorniProduzione" INTEGER,
  "inizioProduzione" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "PianoOrdine" ENABLE ROW LEVEL SECURITY;
