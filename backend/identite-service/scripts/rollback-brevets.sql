-- Annule migrate-brevets.sql.
-- Usage : psql -U postgres -d plongee_db -f rollback-brevets.sql

DROP TABLE IF EXISTS identite.brevets;
