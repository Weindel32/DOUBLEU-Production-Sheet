-- Kit, descrizione e colore dell'articolo dell'Order App collegato: se l'id cambia, la scheda si ricollega da sola.
ALTER TABLE "Scheda" ADD COLUMN IF NOT EXISTS "firmaOrderApp" TEXT;
