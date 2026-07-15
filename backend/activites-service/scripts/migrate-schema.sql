-- Déplace les tables sorties/plongees/palanquees/composer/inscriptions/
-- attributions/incidents du schéma `public` (monolithe) vers un schéma
-- dédié `activites`, matérialisant le cloisonnement logique des données de
-- ce microservice. À exécuter une seule fois, base déjà seedée, backend
-- (monolithe) et activites-service arrêtés le temps de la migration.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-schema.sql

CREATE SCHEMA IF NOT EXISTS activites;

ALTER TABLE IF EXISTS public.sorties SET SCHEMA activites;
ALTER TABLE IF EXISTS public.plongees SET SCHEMA activites;
ALTER TABLE IF EXISTS public.palanquees SET SCHEMA activites;
ALTER TABLE IF EXISTS public.composer SET SCHEMA activites;
ALTER TABLE IF EXISTS public.inscriptions SET SCHEMA activites;
ALTER TABLE IF EXISTS public.attributions SET SCHEMA activites;
ALTER TABLE IF EXISTS public.incidents SET SCHEMA activites;

-- Note : rôle Postgres partagé (`postgres`) utilisé par tous les services,
-- comme pour le pilote formation-service — un rôle DB dédié par service
-- reste une cible différée, pas bloquante pour la soutenance.
