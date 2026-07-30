-- Ajoute la liaison d'une séance pratique à la sortie (activites-service,
-- type "Formation") sur laquelle elle se déroule réellement. Référence
-- applicative uniquement (num-string cross-service, comme id_moniteur sur
-- `formations`) : pas de contrainte FK Postgres vers un schéma d'un autre
-- service.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-seance-sortie.sql

ALTER TABLE formation.seances ADD COLUMN IF NOT EXISTS id_sortie INTEGER;
