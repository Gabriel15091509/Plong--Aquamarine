-- Rollback de migrate-echeancier.sql.
-- Usage : psql -U postgres -d plongee_db -f rollback-echeancier.sql

DROP TABLE IF EXISTS finance.echeances;
DROP TABLE IF EXISTS finance.echeanciers;
