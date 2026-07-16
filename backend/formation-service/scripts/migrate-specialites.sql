CREATE TABLE IF NOT EXISTS formation.formations_specialites (
  id_specialite_formation SERIAL PRIMARY KEY,
  num_adherent VARCHAR(20) NOT NULL,
  id_moniteur INTEGER NOT NULL,
  type_specialite VARCHAR(30) NOT NULL,
  date_debut DATE NOT NULL,
  date_obtention_prevue DATE,
  statut VARCHAR(20) NOT NULL DEFAULT 'En cours',
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE formation.formations ADD COLUMN IF NOT EXISTS appreciation_moniteur VARCHAR(20);
