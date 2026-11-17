-- Ordine a mano delle schede dentro un ordine (priorità di produzione). Null = ordine dell'Order App.
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "posizione" INTEGER;
