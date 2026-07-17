ALTER TYPE enum_adherents_niveau RENAME VALUE 'Débutant' TO 'Baptême';
ALTER TYPE enum_adherents_statut ADD VALUE IF NOT EXISTS 'En formation';
ALTER TYPE enum_adherents_statut ADD VALUE IF NOT EXISTS 'Ancien';
ALTER TABLE identite.adherents ADD COLUMN IF NOT EXISTS num_brevet VARCHAR(50);
