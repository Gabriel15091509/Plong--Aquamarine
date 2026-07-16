-- Ajoute la planification/feuille de présence des séances de formation
-- (table `seances`, un statut Planifiée/Réalisée/Absence par séance — la
-- formation étant déjà liée à un seul adhérent, pas besoin d'une table de
-- participants séparée) et une date prévue de passage du brevet sur
-- `formations`. À exécuter une fois, formation-service arrêté le temps de la
-- migration.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-seances-brevet.sql

CREATE TABLE IF NOT EXISTS formation.seances (
  id_seance SERIAL PRIMARY KEY,
  id_formation INTEGER NOT NULL REFERENCES formation.formations(id_formation) ON DELETE CASCADE,
  date_seance DATE NOT NULL,
  type_seance VARCHAR(20) NOT NULL,
  contenu VARCHAR(255),
  statut VARCHAR(20) NOT NULL DEFAULT 'Planifiée',
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE formation.formations ADD COLUMN IF NOT EXISTS date_examen_brevet DATE;
