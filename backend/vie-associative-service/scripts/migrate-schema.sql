-- Déplace les tables adhesions/certificats_medicaux/alertes du schéma
-- `public` (monolithe) vers un schéma dédié `vie_associative`, matérialisant
-- le cloisonnement logique des données de ce microservice. À exécuter une
-- seule fois, base déjà seedée, backend (monolithe) et
-- vie-associative-service arrêtés le temps de la migration.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-schema.sql

CREATE SCHEMA IF NOT EXISTS vie_associative;

ALTER TABLE IF EXISTS public.adhesions SET SCHEMA vie_associative;
ALTER TABLE IF EXISTS public.certificats_medicaux SET SCHEMA vie_associative;
ALTER TABLE IF EXISTS public.alertes SET SCHEMA vie_associative;

-- Note : rôle Postgres partagé (`postgres`) utilisé par tous les services,
-- comme pour le pilote formation-service — un rôle DB dédié par service
-- reste une cible différée, pas bloquante pour la soutenance.
