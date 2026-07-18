-- Échéancier de paiement (Adhésion/Formation/Sortie payés en plusieurs
-- fois) : un `echeancier` regroupe N `echeances` datées, chacune reliée à
-- son `Paiement` une fois réglée (id_paiement). Suit le même pattern
-- polymorphe (type_paiement + reference_id + num_adherent) que
-- `finance.paiements`.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-echeancier.sql

CREATE TABLE IF NOT EXISTS finance.echeanciers (
  id_echeancier SERIAL PRIMARY KEY,
  type_paiement VARCHAR(30) NOT NULL,
  reference_id VARCHAR(50) NOT NULL,
  num_adherent VARCHAR(20) NOT NULL,
  id_tresorier INTEGER,
  montant_total NUMERIC(10,2) NOT NULL,
  nb_echeances INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'En cours',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.echeances (
  id_echeance SERIAL PRIMARY KEY,
  id_echeancier INTEGER NOT NULL REFERENCES finance.echeanciers(id_echeancier) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  date_echeance DATE NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'En attente',
  id_paiement INTEGER REFERENCES finance.paiements(id_paiement),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
