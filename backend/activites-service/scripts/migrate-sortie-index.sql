-- Index sur date_heure : le planning (GET /api/sorties, écran calendrier)
-- trie/filtre toujours par cette colonne ; sans index, ce tri dégénère en
-- tri séquentiel à mesure que l'historique des sorties s'accumule
-- (exigence 4.3 : consultation du planning < 3s).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-index.sql

CREATE INDEX IF NOT EXISTS idx_sorties_date_heure ON activites.sorties (date_heure);
