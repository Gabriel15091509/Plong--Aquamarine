-- Rollback de migrate-sortie-meteo-tests-v2.sql
-- Usage : psql -U postgres -d plongee_db -f rollback-sortie-meteo-tests-v2.sql
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS meteo_test_j5_fait;
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS meteo_test_j4_fait;
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS meteo_motifs_detectes;
