-- Déplace les tables formations/competences du schéma `public` (monolithe)
-- vers un schéma dédié `formation`, matérialisant le cloisonnement logique
-- des données de ce microservice. À exécuter une seule fois, base déjà
-- seedée, backend et formation-service arrêtés le temps de la migration.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-schema.sql

CREATE SCHEMA IF NOT EXISTS formation;

ALTER TABLE IF EXISTS public.formations SET SCHEMA formation;
ALTER TABLE IF EXISTS public.competences SET SCHEMA formation;

-- Note pilote : les deux tables restent accessibles avec l'utilisateur
-- Postgres partagé (`postgres`) utilisé par tous les services pour cette
-- première migration — un rôle DB dédié par service (mentionné dans le plan
-- comme cible finale) pourra être introduit lors de la réplication aux 5
-- autres services, une fois le motif validé une fois sur le pilote.
