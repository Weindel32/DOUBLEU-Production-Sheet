-- Fasi del consuntivo segnate complete: a consuntivo aperto contano lo speso vero (anche se sotto il previsto).
ALTER TABLE "ConsuntivoOrdine" ADD COLUMN IF NOT EXISTS "fasiComplete" TEXT;
