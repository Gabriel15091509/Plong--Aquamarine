-- Historique des niveaux/brevets obtenus par un adhérent (une ligne par
-- passage de niveau, jamais écrasée — contrairement à adherents.niveau/
-- date_obtention_niveau/num_brevet, qui restent le niveau COURANT en cache,
-- toujours mis à jour en parallèle). Alimentée automatiquement par
-- AdherentService.updateNiveau, pas de création manuelle pour l'instant.
--
-- VARCHAR + CHECK plutôt qu'un vrai type ENUM Postgres : évite de dépendre
-- du nom interne que Sequelize aurait généré (enum_brevets_niveau), pour un
-- gain d'intégrité identique (Sequelize envoie/reçoit de simples chaînes,
-- déjà validées côté modèle avant d'atteindre la base).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-brevets.sql

CREATE TABLE IF NOT EXISTS identite.brevets (
  id_brevet SERIAL PRIMARY KEY,
  num_adherent VARCHAR(20) NOT NULL REFERENCES identite.adherents(num_adherent) ON DELETE CASCADE,
  niveau VARCHAR(20) NOT NULL CHECK (niveau IN ('Baptême', 'Niveau 1', 'Niveau 2', 'Niveau 3', 'Niveau 4', 'Moniteur')),
  num_brevet VARCHAR(50),
  date_obtention TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brevets_num_adherent ON identite.brevets(num_adherent);
