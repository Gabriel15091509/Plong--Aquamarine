\encoding UTF8

-- Élargit "sorties.type" pour accueillir les nouveaux libellés de types
-- d'activités (ex: "Plongée d'exploration", 21 caractères > STRING(20)).
ALTER TABLE activites.sorties ALTER COLUMN type TYPE VARCHAR(30);
