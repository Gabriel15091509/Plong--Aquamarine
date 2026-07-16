-- Annule migrate-seances-brevet.sql.
-- Usage : psql -U postgres -d plongee_db -f rollback-seances-brevet.sql

ALTER TABLE formation.formations DROP COLUMN IF EXISTS date_examen_brevet;
DROP TABLE IF EXISTS formation.seances;
