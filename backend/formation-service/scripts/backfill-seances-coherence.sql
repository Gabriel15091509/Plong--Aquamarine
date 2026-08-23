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
--  3. Conséquence des deux points ci-dessus sur le jeu de données réel :
--     l'ancienne génération de séances (300 lignes tirées au hasard sur
--     l'ensemble des formations, sans lien avec nb_seances_prevues ni le
--     statut) a laissé des formations "Terminée" avec bien moins de
--     lignes formation.seances "Réalisée" que nb_seances_prevues ne
--     l'exige — recalculer nb_seances_realisees (étape 1./2. d'une
--     précédente version de ce script) les affichait alors bloquées sous
--     100%, alors même qu'elles sont closes et n'ont plus de séance à
--     pointer.
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
--  2. Complète les séances "Réalisée" manquantes des formations "Terminée"
--     qui n'ont pas assez de vraies lignes formation.seances en base pour
--     justifier nb_seances_prevues — cas réel constaté en production
--     (jeu de données seedé avant le correctif de seedFormation.js, qui
--     générait ses ~300 séances indépendamment de nb_seances_prevues et du
--     statut de la formation). La 1. ne peut que recompter les séances déjà
--     en base, jamais en inventer : sans cette étape, une formation
--     "Terminée" pouvait rester bloquée sous 100% faute de lignes
--     formation.seances suffisantes, alors même qu'elle est bien close et
--     qu'aucune séance n'est plus "à pointer". Dates réparties dans la
--     période de la formation (par pas de 3 jours, plafonné à la fin),
--     type "Théorique" (pas de lien à une vraie sortie activites-service
--     disponible depuis ce backfill), même liste de contenus que le seed.
--  3. Recalcule nb_seances_realisees de TOUTES les formations à partir du
--     décompte réel des séances "Réalisée" en base (après les 1. et 2.
--     ci-dessus).
--
-- Idempotent : la 1. ne trouve plus rien à résoudre une fois passée une
-- première fois (plus aucune séance "Planifiée" derrière une formation
-- close) ; la 2. compare son déficit au compte réel des lignes
-- formation.seances déjà en base (pas à nb_seances_realisees, qui n'est
-- recalculée qu'en 3.), donc ne trouve plus rien à insérer une fois que
-- ce compte a rattrapé nb_seances_prevues ; la 3. recalcule toujours la
-- même valeur à partir des données réelles.
-- Pas de rollback dédié : une fois nb_seances_realisees recalculé depuis
-- les vraies séances, on ne peut plus distinguer "corrigé par ce script"
-- de "valeur déjà correcte" sans colonne d'audit dédiée ; les séances
-- résolues en "Absence" ne peuvent pas être automatiquement remises à
-- "Planifiée", et les séances insérées par la 2. ne peuvent pas être
-- automatiquement retirées sans perdre l'information de lesquelles ont
-- été touchées/créées — sauvegarder avant exécution en environnement
-- partagé (même limite que backfill-adherent-niveau-formation-terminee.sql
-- côté identite-service).
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

-- 2. Complète les séances "Réalisée" manquantes des formations "Terminée"
--    dont le décompte réel de séances "Réalisée" en base est encore
--    inférieur à nb_seances_prevues. Le déficit est calculé sur le compte
--    réel des lignes formation.seances (pas sur la colonne
--    nb_seances_realisees, pas encore recalculée à ce stade).
INSERT INTO formation.seances
  (id_formation, date_seance, type_seance, contenu, statut, created_at, updated_at)
SELECT
  f.id_formation,
  LEAST(
    f.date_debut::date + (gs.i * 3)::int,
    COALESCE(f.date_fin_reelle, f.date_fin_prevue)::date
  ) AS date_seance,
  'Théorique',
  (ARRAY[
    'Théorie des tables de plongée', 'Gestion de la décompression',
    'Exercices de flottabilité', 'Orientation sous-marine',
    'Procédures de sécurité', 'Assistance et sauvetage',
    'Utilisation de l''ordinateur de plongée', 'Biologie marine'
  ])[1 + ((f.id_formation + gs.i) % 8)],
  'Réalisée',
  now(), now()
FROM formation.formations f
CROSS JOIN LATERAL generate_series(
  1,
  f.nb_seances_prevues - (
    SELECT COUNT(*) FROM formation.seances s
    WHERE s.id_formation = f.id_formation AND s.statut = 'Réalisée'
  )
) AS gs(i)
WHERE f.statut = 'Terminée'
  AND f.nb_seances_prevues IS NOT NULL
  AND f.nb_seances_prevues > (
    SELECT COUNT(*) FROM formation.seances s
    WHERE s.id_formation = f.id_formation AND s.statut = 'Réalisée'
  );

-- 3. Recalcule nb_seances_realisees pour toutes les formations à partir
--    du décompte réel des séances "Réalisée" (après les étapes 1. et 2.).
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
