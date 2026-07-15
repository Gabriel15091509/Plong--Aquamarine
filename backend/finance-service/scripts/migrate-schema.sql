-- Déplace la table paiements du schéma `public` (monolithe) vers un schéma
-- dédié `finance`, matérialisant le cloisonnement logique des données de ce
-- microservice. À exécuter une seule fois, base déjà seedée, backend
-- (monolithe) et finance-service arrêtés le temps de la migration.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-schema.sql

CREATE SCHEMA IF NOT EXISTS finance;

ALTER TABLE IF EXISTS public.paiements SET SCHEMA finance;

-- Note : rôle Postgres partagé (`postgres`) utilisé par tous les services,
-- comme pour le pilote formation-service — un rôle DB dédié par service
-- reste une cible différée, pas bloquante pour la soutenance.
