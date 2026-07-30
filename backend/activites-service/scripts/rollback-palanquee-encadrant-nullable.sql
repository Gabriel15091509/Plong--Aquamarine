-- Attention : échouera si des lignes existent déjà avec id_moniteur_encadrant NULL.
ALTER TABLE activites.palanquees ALTER COLUMN id_moniteur_encadrant SET NOT NULL;
