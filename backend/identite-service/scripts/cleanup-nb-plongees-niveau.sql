-- Aligne nb_plongees_total sur le minimum requis par le niveau de plongée
-- (seed initial généré au hasard, sans lien avec le niveau) :
--   Niveau 1 : 6 plongées (initiation)
--   Niveau 2 : 8 plongées (autonomie 20m)
--   Niveau 3 : 10 plongées (autonomie 40m)
--   Niveau 4 : 20 plongées
--   Moniteur : 60 plongées
-- Ne relève que les adhérents en dessous du seuil de leur niveau ; ne
-- touche jamais Baptême (aucun minimum).
UPDATE identite.adherents
SET nb_plongees_total = CASE niveau
    WHEN 'Niveau 1' THEN 6
    WHEN 'Niveau 2' THEN 8
    WHEN 'Niveau 3' THEN 10
    WHEN 'Niveau 4' THEN 20
    WHEN 'Moniteur' THEN 60
  END
WHERE niveau IN ('Niveau 1', 'Niveau 2', 'Niveau 3', 'Niveau 4', 'Moniteur')
  AND nb_plongees_total < CASE niveau
    WHEN 'Niveau 1' THEN 6
    WHEN 'Niveau 2' THEN 8
    WHEN 'Niveau 3' THEN 10
    WHEN 'Niveau 4' THEN 20
    WHEN 'Moniteur' THEN 60
  END;
