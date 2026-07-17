-- Recalcule nb_plongees_total pour TOUS les adhérents, dans une fourchette
-- réaliste et non chevauchante par niveau (remplace le tirage précédent qui
-- ajoutait jusqu'à +100 au minimum sans plafond, produisant par exemple un
-- Niveau 1 avec plus de plongées qu'un Niveau 4) :
--   Baptême  : 0-3
--   Niveau 1 : 6-15
--   Niveau 2 : 8-25
--   Niveau 3 : 10-40
--   Niveau 4 : 20-60
--   Moniteur : 60-150
UPDATE identite.adherents
SET nb_plongees_total = CASE niveau
    WHEN 'Baptême'  THEN (0 + floor(random() * 4))::int
    WHEN 'Niveau 1' THEN (6 + floor(random() * 10))::int
    WHEN 'Niveau 2' THEN (8 + floor(random() * 18))::int
    WHEN 'Niveau 3' THEN (10 + floor(random() * 31))::int
    WHEN 'Niveau 4' THEN (20 + floor(random() * 41))::int
    WHEN 'Moniteur' THEN (60 + floor(random() * 91))::int
    ELSE nb_plongees_total
  END;
