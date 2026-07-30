\encoding UTF8

-- Attention : échouera si des lignes contiennent déjà un type de plus de
-- 20 caractères (ex: "Plongée d'exploration").
ALTER TABLE activites.sorties ALTER COLUMN type TYPE VARCHAR(20);
