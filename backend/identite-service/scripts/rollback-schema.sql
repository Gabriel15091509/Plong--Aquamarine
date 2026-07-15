-- Rollback de migrate-schema.sql : remet users/adherents/moniteurs/
-- president/tresoriers dans le schéma `public` (monolithe), au cas où
-- identite-service serait abandonné ou doit être retesté depuis le début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS identite.users SET SCHEMA public;
ALTER TABLE IF EXISTS identite.adherents SET SCHEMA public;
ALTER TABLE IF EXISTS identite.moniteurs SET SCHEMA public;
ALTER TABLE IF EXISTS identite.president SET SCHEMA public;
ALTER TABLE IF EXISTS identite.tresoriers SET SCHEMA public;

DROP SCHEMA IF EXISTS identite;
