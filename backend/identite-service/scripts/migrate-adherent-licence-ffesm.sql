ALTER TABLE identite.adherents ADD COLUMN IF NOT EXISTS num_licence_ffesm VARCHAR(30);

-- Reprend le n° de licence FFESM déjà saisi sur la dernière adhésion FFESM
-- de chaque adhérent (par année). Exclut explicitement le niveau Baptême
-- (n'est pas licencié FFESM), même si aucune ligne FFESM ne devrait plus lui
-- être rattachée après le nettoyage précédent (cleanup-adhesions-bapteme.sql).
UPDATE identite.adherents a
SET num_licence_ffesm = sub.num_licence_ffesm
FROM (
  SELECT DISTINCT ON (num_adherent) num_adherent, num_licence_ffesm
  FROM vie_associative.adhesions
  WHERE type = 'FFESM' AND num_licence_ffesm IS NOT NULL
  ORDER BY num_adherent, annee_adhesion DESC
) sub
WHERE a.num_adherent = sub.num_adherent
  AND a.niveau <> 'Baptême';
