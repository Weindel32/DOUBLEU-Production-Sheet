-- Controllo qualità non è più una fase (si fa durante la produzione); l'ultima fase è "Pronto per la consegna".
-- Gli articoli già pronti con le vecchie fasi risultano consegnati il giorno dell'ultima fase finita,
-- così non ricompaiono "in attesa" da settimane. Le altre schede perdono solo la voce controllo.
WITH s AS (
  SELECT id, fasi::jsonb AS j FROM "Scheda" WHERE fasi ~ '^\s*\{'
),
st AS (
  SELECT s.id,
    CASE
      WHEN s.j -> f.k IS NULL THEN 'vuota'
      WHEN jsonb_typeof(s.j -> f.k) = 'string' AND s.j ->> f.k = 'salta' THEN 'salta'
      WHEN jsonb_typeof(s.j -> f.k) = 'string' AND s.j ->> f.k ~ '^\d{4}-\d{2}-\d{2}$' THEN 'fatta'
      WHEN jsonb_typeof(s.j -> f.k) = 'object' AND COALESCE(s.j -> f.k ->> 'fine', '') ~ '^\d{4}-\d{2}-\d{2}$' THEN 'fatta'
      ELSE 'altro'
    END AS stato,
    CASE
      WHEN jsonb_typeof(s.j -> f.k) = 'string' AND s.j ->> f.k ~ '^\d{4}-\d{2}-\d{2}$' THEN s.j ->> f.k
      WHEN jsonb_typeof(s.j -> f.k) = 'object' AND COALESCE(s.j -> f.k ->> 'fine', '') ~ '^\d{4}-\d{2}-\d{2}$' THEN s.j -> f.k ->> 'fine'
    END AS fine
  FROM s CROSS JOIN unnest(ARRAY['cartamodello', 'tessuto', 'taglio', 'confezione', 'decorazione', 'controllo']) AS f(k)
),
pronte AS (
  SELECT id, MAX(fine) AS ultima FROM st GROUP BY id
  HAVING bool_and(stato IN ('salta', 'fatta')) AND COUNT(*) FILTER (WHERE stato = 'fatta') > 0
)
UPDATE "Scheda" sc
SET fasi = ((s.j - 'controllo')
  || CASE WHEN p.ultima IS NOT NULL THEN jsonb_build_object('consegna', jsonb_build_object('fine', p.ultima)) ELSE '{}'::jsonb END)::text
FROM s LEFT JOIN pronte p ON p.id = s.id
WHERE sc.id = s.id AND (s.j ? 'controllo' OR p.ultima IS NOT NULL);
