-- Rollback de migrate-schema.sql : remet materiels/reparations dans le
-- schéma `public` (monolithe), au cas où materiel-service serait abandonné
-- ou doit être retesté depuis le début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS materiel.materiels SET SCHEMA public;
ALTER TABLE IF EXISTS materiel.reparations SET SCHEMA public;

DROP SCHEMA IF EXISTS materiel;
