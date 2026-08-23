\encoding UTF8

-- Constat : deux incohérences dans les données de séances de formation
-- (visibles dans le jeu de données de démo, seedFormation.js, mais aussi
-- reproductibles en usage réel avant les correctifs qui accompagnent ce
-- script) :
--
--  1. formation.formations.nb_seances_realisees pouvait être totalement
--     déconnecté des lignes formation.seances réellement marquées
--     "Réalisée" — seedFormation.js le tirait au hasard indépendamment
--     des séances générées, et FormationForm.jsx exposait ce champ en
--     saisie libre côté formulaire d'édition, sans jamais le recalculer
--     depuis les vraies séances. Résultat : la barre de progression
--     affichée (FormationDetails.jsx, "X séances / Y prévues -> Z %")
--     ne reflétait pas la réalité, avec des pourcentages incohérents.
--
--  2. Une formation "Terminée" (ou "Abandonnée", tout aussi close) pouvait
--     laisser derrière elle des séances encore au statut "Planifiée" —
--     le seed en générait sans tenir compte du statut de la formation, et
--     rien côté serveur n'empêchait jusqu'ici de faire passer une
--     formation à "Terminée" via la route générique PUT /formations/:id
--     sans passer par FormationService.completeFormation (seule méthode
--     qui vérifie que toutes les séances prévues sont réalisées). Une
--     séance "Planifiée" derrière une formation close restait affichée
--     avec ses boutons "Présent/Absent" (FormationSeances.jsx) — une
--     séance à pointer qui n'a plus lieu d'être.
--
-- Corrigé pour la suite par (voir les fichiers cités, ne sont PAS modifiés
-- par ce script qui ne touche que les données existantes) :
--  - FormationService.update rejette désormais un passage direct à
--    "Terminée" (redirige vers completeFormation) et ignore toute valeur
--    de nb_seances_realisees envoyée par le client ;
--  - SeanceService.validateSeanceData plafonne la création de séances à
--    nb_seances_prevues, et SeanceService.updateStatut refuse de pointer
--    une séance d'une formation "Terminée"/"Abandonnée" ;
--  - FormationSeances.jsx n'affiche plus les boutons de pointage pour une
--    formation qui n'est pas "En cours" ;
--  - seedFormation.js génère désormais les séances par formation, cappées
--    à nb_seances_prevues, toutes "Réalisée" pour une formation "Terminée".
--
-- Ce script corrige les données déjà en base :
--  1. Résout (statut -> "Absence") toute séance encore "Planifiée" d'une
--     formation "Terminée" ou "Abandonnée" — jamais "Réalisée", pour ne
--     pas gonfler artificiellement nb_seances_realisees sur une formation
--     déjà close sans preuve réelle de présence.
--  2. Recalcule nb_seances_realisees de TOUTES les formations à partir du
--     décompte réel des séances "Réalisée" en base.
--
-- Idempotent : la 1. ne trouve plus rien à résoudre une fois passée une
-- première fois (plus aucune séance "Planifiée" derrière une formation
-- close), la 2. recalcule toujours la même valeur à partir des données
-- réelles.
-- Pas de rollback dédié : une fois nb_seances_realisees recalculé depuis
-- les vraies séances, on ne peut plus distinguer "corrigé par ce script"
-- de "valeur déjà correcte" sans colonne d'audit dédiée, et les séances
-- résolues en "Absence" ne peuvent pas être automatiquement remises à
-- "Planifiée" sans perdre l'information de laquelle a été touchée —
-- sauvegarder avant exécution en environnement partagé (même limite que
-- backfill-adherent-niveau-formation-terminee.sql côté identite-service).
--
-- Vérification avant application :
--   SELECT f.id_formation, f.statut, s.id_seance, s.statut AS statut_seance
--   FROM formation.seances s
--   JOIN formation.formations f ON f.id_formation = s.id_formation
--   WHERE s.statut = 'Planifiée' AND f.statut IN ('Terminée', 'Abandonnée');
--
--   SELECT f.id_formation, f.nb_seances_realisees AS avant,
--          COUNT(s.id_seance) FILTER (WHERE s.statut = 'Réalisée') AS reel
--   FROM formation.formations f
--   LEFT JOIN formation.seances s ON s.id_formation = f.id_formation
--   GROUP BY f.id_formation, f.nb_seances_realisees
--   HAVING f.nb_seances_realisees <> COUNT(s.id_seance) FILTER (WHERE s.statut = 'Réalisée');

-- 1. Résout les séances "Planifiée" orphelines derrière une formation close.
UPDATE formation.seances s
SET statut = 'Absence',
    commentaire = COALESCE(s.commentaire, '') ||
      CASE WHEN s.commentaire IS NOT NULL AND s.commentaire <> '' THEN ' ' ELSE '' END ||
      '[Clôturée automatiquement : formation déjà terminée/abandonnée — backfill-seances-coherence.sql]'
FROM formation.formations f
WHERE s.id_formation = f.id_formation
  AND s.statut = 'Planifiée'
  AND f.statut IN ('Terminée', 'Abandonnée');

-- 2. Recalcule nb_seances_realisees pour toutes les formations à partir
--    du décompte réel des séances "Réalisée".
UPDATE formation.formations SET nb_seances_realisees = 0;

UPDATE formation.formations f
SET nb_seances_realisees = sub.n
FROM (
  SELECT id_formation, COUNT(*) AS n
  FROM formation.seances
  WHERE statut = 'Réalisée'
  GROUP BY id_formation
) sub
WHERE f.id_formation = sub.id_formation;
