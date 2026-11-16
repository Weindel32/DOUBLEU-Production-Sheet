-- WS andava decifrato: T-Shirt WS → T-Shirt Donna, Tank Top Ws → Canotta Donna (codici scheda invariati).
UPDATE "Modello" SET "categoria" = 'Canotta Donna' WHERE "categoria" = 'Tank Top Ws';
UPDATE "Modello" SET "categoria" = 'T-Shirt Donna' WHERE "categoria" = 'T-Shirt WS';
-- Il taglio donna in taglie bambina è la fascia Bambina, non Kids.
UPDATE "Modello" SET "fascia" = 'Bambina' WHERE "categoria" = 'T-Shirt Donna' AND "fascia" = 'Kids';
-- Le schede di canotta finite in T-Shirt WS seguono la categoria del loro modello.
UPDATE "Scheda" SET "categoria" = 'Canotta Donna'
  WHERE "categoria" = 'Tank Top Ws'
     OR ("categoria" = 'T-Shirt WS' AND "codiceModello" IN (SELECT "codice" FROM "Modello" WHERE "categoria" = 'Canotta Donna'));
UPDATE "Scheda" SET "categoria" = 'T-Shirt Donna' WHERE "categoria" = 'T-Shirt WS';
UPDATE "Scheda" SET "genere" = 'Bambina' WHERE "categoria" = 'T-Shirt Donna' AND "genere" = 'Junior';
-- Nomi: "Ws" → "Donna" (T-Shirt Ws micro → T-Shirt Donna micro, Canotta Ws → Canotta Donna).
UPDATE "Modello" SET "descrizione" = regexp_replace("descrizione", '\mWs\M', 'Donna', 'gi') WHERE "descrizione" ~* '\mws\M';
UPDATE "Scheda" SET "nomeArticolo" = regexp_replace("nomeArticolo", '\mWs\M', 'Donna', 'gi') WHERE "nomeArticolo" ~* '\mws\M';
-- Refuso: Canotta Strainght → Canotta Straight (il modello meno avvitato).
UPDATE "Modello" SET "descrizione" = regexp_replace("descrizione", 'Strainght', 'Straight', 'gi') WHERE "descrizione" ~* 'strainght';
UPDATE "Scheda" SET "nomeArticolo" = regexp_replace("nomeArticolo", 'Strainght', 'Straight', 'gi') WHERE "nomeArticolo" ~* 'strainght';
