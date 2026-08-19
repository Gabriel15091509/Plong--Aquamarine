-- Rollback de migrate-sortie-meteo-tests.sql
-- Usage : psql -U postgres -d plongee_db -f rollback-sortie-meteo-tests.sql
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS meteo_test_j3_fait;
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS meteo_alerte_j1_envoyee;
