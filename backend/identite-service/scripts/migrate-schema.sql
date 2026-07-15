-- Déplace les tables users/adherents/moniteurs/president/tresoriers du
-- schéma `public` (monolithe) vers un schéma dédié `identite`, matérialisant
-- le cloisonnement logique des données de ce microservice. À exécuter une
-- seule fois, base déjà seedée, backend (monolithe) et identite-service
-- arrêtés le temps de la migration.
--
-- Les FK entre ces 5 tables (Adherent/Moniteur/Tresorier → users,
-- President → moniteurs, Adherent.archived_by → president) restent
-- valides : elles bougent toutes ensemble vers le même schéma.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-schema.sql

CREATE SCHEMA IF NOT EXISTS identite;

ALTER TABLE IF EXISTS public.users SET SCHEMA identite;
ALTER TABLE IF EXISTS public.adherents SET SCHEMA identite;
ALTER TABLE IF EXISTS public.moniteurs SET SCHEMA identite;
ALTER TABLE IF EXISTS public.president SET SCHEMA identite;
ALTER TABLE IF EXISTS public.tresoriers SET SCHEMA identite;

-- Note : rôle Postgres partagé (`postgres`) utilisé par tous les services,
-- comme pour le pilote formation-service — un rôle DB dédié par service
-- reste une cible différée, pas bloquante pour la soutenance.
