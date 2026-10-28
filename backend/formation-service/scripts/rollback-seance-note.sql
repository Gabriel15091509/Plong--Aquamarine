-- Rollback de migrate-seance-note.sql
--
-- Usage : psql -U postgres -d plongee_db -f rollback-seance-note.sql

ALTER TABLE formation.seances DROP COLUMN IF EXISTS note;
