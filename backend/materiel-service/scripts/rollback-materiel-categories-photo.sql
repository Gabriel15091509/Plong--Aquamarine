ALTER TABLE materiel.materiels ALTER COLUMN localisation DROP DEFAULT;
ALTER TABLE materiel.materiels ADD COLUMN IF NOT EXISTS photo BYTEA;
ALTER TABLE materiel.materiels DROP COLUMN IF EXISTS photo_path;
ALTER TABLE materiel.materiels DROP COLUMN IF EXISTS batterie;
ALTER TABLE materiel.materiels DROP COLUMN IF EXISTS etat_sangles;
ALTER TABLE materiel.materiels DROP COLUMN IF EXISTS capacite;
