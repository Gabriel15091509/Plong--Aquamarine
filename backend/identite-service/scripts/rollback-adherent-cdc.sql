ALTER TABLE identite.adherents DROP COLUMN IF EXISTS num_brevet;
ALTER TYPE enum_adherents_niveau RENAME VALUE 'Baptême' TO 'Débutant';
-- Note : Postgres ne permet pas de retirer une valeur d'ENUM une fois ajoutée.
-- 'En formation' et 'Ancien' resteront des valeurs valides de enum_adherents_statut.
