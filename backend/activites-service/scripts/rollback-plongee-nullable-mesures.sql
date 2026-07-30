-- Attention : échouera si des lignes existent déjà avec profondeur_max ou duree NULL.
ALTER TABLE activites.plongees ALTER COLUMN profondeur_max SET NOT NULL;
ALTER TABLE activites.plongees ALTER COLUMN duree SET NOT NULL;
