-- Localisation précise du site de plongée (GPS) : les noms de site ("Tour de
-- Boucan", "Passe de l'Ermitage"...) sont des surnoms locaux informels qui ne
-- géocodent pas de façon fiable — le président choisit donc la position sur
-- une carte au clic plutôt qu'une résolution automatique du texte libre.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-localisation.sql
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
