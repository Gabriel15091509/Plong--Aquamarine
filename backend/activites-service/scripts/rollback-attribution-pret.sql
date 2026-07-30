ALTER TABLE activites.attributions DROP COLUMN IF EXISTS piece_identite_retenue;
ALTER TABLE activites.attributions ALTER COLUMN id_sortie SET NOT NULL;
