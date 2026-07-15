-- Rollback de migrate-schema.sql : remet paiements dans le schéma `public`
-- (monolithe), au cas où finance-service serait abandonné ou doit être
-- retesté depuis le début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS finance.paiements SET SCHEMA public;

DROP SCHEMA IF EXISTS finance;
