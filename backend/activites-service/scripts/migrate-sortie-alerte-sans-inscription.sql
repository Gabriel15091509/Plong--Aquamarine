\encoding UTF8

-- Traçabilité de l'alerte "sortie sans inscription" (voir SortieService.
-- alerterSortiesSansInscription) : un seul envoi par sortie tant qu'elle
-- reste dans la fenêtre d'alerte (J-3) sans aucune inscription, jamais un
-- rappel quotidien — même principe que meteo_alerte_j1_envoyee.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-alerte-sans-inscription.sql

ALTER TABLE activites.sorties
  ADD COLUMN IF NOT EXISTS alerte_sans_inscription_envoyee BOOLEAN NOT NULL DEFAULT false;
