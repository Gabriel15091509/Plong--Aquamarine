-- Rollback de migrate-schema.sql : remet adhesions/certificats_medicaux/
-- alertes dans le schéma `public` (monolithe), au cas où
-- vie-associative-service serait abandonné ou doit être retesté depuis le
-- début.
--
-- Usage : psql -U postgres -d plongee_db -f rollback-schema.sql

ALTER TABLE IF EXISTS vie_associative.adhesions SET SCHEMA public;
ALTER TABLE IF EXISTS vie_associative.certificats_medicaux SET SCHEMA public;
ALTER TABLE IF EXISTS vie_associative.alertes SET SCHEMA public;

DROP SCHEMA IF EXISTS vie_associative;
