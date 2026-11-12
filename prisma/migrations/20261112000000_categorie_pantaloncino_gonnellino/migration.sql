-- Short/Skirt si confondevano con Shirt in produzione: categorie e descrizioni dei cartamodelli in italiano.
UPDATE "Scheda"  SET "categoria" = 'Pantaloncino' WHERE "categoria" = 'Short';
UPDATE "Scheda"  SET "categoria" = 'Gonnellino'   WHERE "categoria" = 'Skirt';
UPDATE "Modello" SET "categoria" = 'Pantaloncino' WHERE "categoria" = 'Short';
UPDATE "Modello" SET "categoria" = 'Gonnellino'   WHERE "categoria" = 'Skirt';
UPDATE "Modello" SET "descrizione" = regexp_replace("descrizione", '\mShort\M', 'Pantaloncino', 'gi') WHERE "descrizione" ~* '\mshort\M';
UPDATE "Modello" SET "descrizione" = regexp_replace("descrizione", '\mSkirt\M', 'Gonnellino', 'gi') WHERE "descrizione" ~* '\mskirt\M';
