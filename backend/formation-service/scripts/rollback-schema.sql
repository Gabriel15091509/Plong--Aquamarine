-- Rollback de migrate-schema.sql : remet formations/competences dans le
-- schéma `public` (monolithe), au cas où le pilote formation-service serait
-- abandonné ou doit être retesté depuis le début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS formation.formations SET SCHEMA public;
ALTER TABLE IF EXISTS formation.competences SET SCHEMA public;

DROP SCHEMA IF EXISTS formation;
