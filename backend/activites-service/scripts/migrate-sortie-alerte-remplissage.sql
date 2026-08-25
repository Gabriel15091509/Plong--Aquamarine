\encoding UTF8

-- Traçabilité de l'alerte "sortie sous-remplie" (voir SortieService.
-- alerterSortiesSousRemplies) : un seul envoi par sortie tant qu'elle reste
-- sous le seuil de remplissage (< 50 % de nb_places) à J-1/J-0 — même
-- principe que alerte_sans_inscription_envoyee.
--
-- Appliquée automatiquement au démarrage du service (voir app.js
-- runPendingMigrations) — ce script n'est conservé que pour référence/usage
-- manuel ponctuel.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-alerte-remplissage.sql

ALTER TABLE activites.sorties
  ADD COLUMN IF NOT EXISTS alerte_remplissage_envoyee BOOLEAN NOT NULL DEFAULT false;
