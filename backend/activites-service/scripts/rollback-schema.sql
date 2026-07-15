-- Rollback de migrate-schema.sql : remet sorties/plongees/palanquees/
-- composer/inscriptions/attributions/incidents dans le schéma `public`
-- (monolithe), au cas où activites-service serait abandonné ou doit être
-- retesté depuis le début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS activites.sorties SET SCHEMA public;
ALTER TABLE IF EXISTS activites.plongees SET SCHEMA public;
ALTER TABLE IF EXISTS activites.palanquees SET SCHEMA public;
ALTER TABLE IF EXISTS activites.composer SET SCHEMA public;
ALTER TABLE IF EXISTS activites.inscriptions SET SCHEMA public;
ALTER TABLE IF EXISTS activites.attributions SET SCHEMA public;
ALTER TABLE IF EXISTS activites.incidents SET SCHEMA public;

DROP SCHEMA IF EXISTS activites;
