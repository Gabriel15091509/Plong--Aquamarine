-- Champs catégorie-spécifiques (blocs d'air, stabilisateurs, ordinateurs) +
-- remplacement du stockage photo en BLOB (jamais exploité par le frontend)
-- par un chemin de fichier, même convention que identite-service.photo.
ALTER TABLE materiel.materiels ADD COLUMN IF NOT EXISTS capacite VARCHAR(20);
ALTER TABLE materiel.materiels ADD COLUMN IF NOT EXISTS etat_sangles VARCHAR(20);
ALTER TABLE materiel.materiels ADD COLUMN IF NOT EXISTS batterie VARCHAR(20);
ALTER TABLE materiel.materiels ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255);
ALTER TABLE materiel.materiels DROP COLUMN IF EXISTS photo;
ALTER TABLE materiel.materiels ALTER COLUMN localisation SET DEFAULT 'Local';
