\encoding UTF8

-- Suite au bug du générateur de seed (NEXT_NIVEAU_MAP mappait à tort
-- "Moniteur" -> "MF1", voir seedFormation.js) : des formations "MF1"
-- avaient été créées pour des adhérents déjà Moniteur depuis des années
-- (date_obtention_niveau largement antérieure à date_debut de la
-- formation), incohérentes avec la règle désormais appliquée à la
-- création (FormationService.checkPrerequis : le niveau visé doit être
-- strictement supérieur au niveau actuel).
--
-- Supprimées plutôt que réaffectées à un autre niveau_vise : ce ne sont
-- pas de vraies formations suivies par un adhérent avec un objectif réel
-- (le générateur les a associées après coup, au hasard), rien à corriger
-- vers une valeur "juste" — les séances/compétences liées sont supprimées
-- avec, à la main : id_formation sur competences/seances est une colonne
-- applicative sans contrainte FK (donc sans ON DELETE CASCADE), même
-- principe que les autres références inter-tables de ce projet.
--
-- Vérification avant application :
--   SELECT f.id_formation, f.num_adherent, f.niveau_vise, a.niveau
--   FROM formation.formations f
--   JOIN identite.adherents a ON a.num_adherent = f.num_adherent
--   WHERE f.niveau_vise = 'MF1' AND a.niveau = 'Moniteur';

DELETE FROM formation.competences
WHERE id_formation IN (
  SELECT f.id_formation
  FROM formation.formations f
  JOIN identite.adherents a ON a.num_adherent = f.num_adherent
  WHERE f.niveau_vise = 'MF1' AND a.niveau = 'Moniteur'
);

DELETE FROM formation.seances
WHERE id_formation IN (
  SELECT f.id_formation
  FROM formation.formations f
  JOIN identite.adherents a ON a.num_adherent = f.num_adherent
  WHERE f.niveau_vise = 'MF1' AND a.niveau = 'Moniteur'
);

DELETE FROM formation.formations f
USING identite.adherents a
WHERE f.num_adherent = a.num_adherent
  AND f.niveau_vise = 'MF1'
  AND a.niveau = 'Moniteur';
