\encoding UTF8

-- Constat : identite.adherents.statut ("En formation" parmi les valeurs
-- possibles) était totalement déconnecté de formation.formations : un
-- adhérent pouvait être "En formation" sans aucune formation "En cours"
-- (seedIdentite.js le tire au hasard, indépendamment des formations —
-- qui sont d'ailleurs seedées après, dans un autre service), et
-- inversement avoir une vraie formation "En cours" tout en restant
-- affiché "Actif". AdherentForm.jsx expose `statut` en saisie libre côté
-- président, sans lien avec les formations de l'adhérent.
--
-- Corrigé pour la suite par (voir les fichiers cités, ne sont PAS modifiés
-- par ce script qui ne touche que les données existantes) :
--  - FormationService.syncAdherentStatutFormation, appelée après chaque
--    création/modification/clôture/ajournement/suppression de formation
--    (create, update, completeFormation, ajourner, delete), répercute sur
--    identite.adherents via un nouvel appel HTTP
--    (identiteClient.syncStatutFormation -> PATCH /adherents/:id/statut-formation
--    -> AdherentService.syncStatutFormation) le fait que l'adhérent ait
--    encore, ou non, au moins une formation "En cours" ;
--  - cette synchronisation ne touche volontairement que la transition
--    "Actif" <-> "En formation" : un adhérent "Suspendu"/"Inactif"/"Ancien"
--    positionné explicitement par le président n'est jamais remis "Actif"
--    ni basculé "En formation" par ce mécanisme automatique ;
--  - seedFormation.js réconcilie désormais statut de la même façon que le
--    niveau (voir le bloc juste après la réconciliation niveau/brevets),
--    pour que chaque nouveau seed reste cohérent dès la génération.
--
-- Ce script rattrape les données déjà en base, avec la même règle de
-- precedence que le correctif runtime :
--  1. Passe "Actif" -> "En formation" pour tout adhérent ayant au moins
--     une formation.formations.statut = 'En cours'.
--  2. Repasse "En formation" -> "Actif" pour tout adhérent qui n'a plus
--     aucune formation.formations.statut = 'En cours' (formation
--     terminée/abandonnée/ajournée/supprimée, ou statut jamais lié à une
--     vraie formation dans le seed).
-- Ne touche jamais "Suspendu"/"Inactif"/"Ancien", dans aucun des deux
-- sens — même limite assumée que le correctif runtime : un adhérent
-- suspendu avec une formation réelle "En cours" reste affiché "Suspendu"
-- (c'est un état plus fort, délibérément posé par le président).
--
-- Vérification avant application :
--   SELECT a.num_adherent, a.statut,
--          EXISTS (
--            SELECT 1 FROM formation.formations f
--            WHERE f.num_adherent = a.num_adherent AND f.statut = 'En cours'
--          ) AS a_une_formation_en_cours
--   FROM identite.adherents a
--   WHERE (a.statut = 'En formation') <> EXISTS (
--     SELECT 1 FROM formation.formations f
--     WHERE f.num_adherent = a.num_adherent AND f.statut = 'En cours'
--   )
--   AND a.statut IN ('Actif', 'En formation');
--
-- Idempotent : chaque UPDATE ne trouve plus rien à corriger une fois
-- statut aligné sur la présence ou non d'une formation "En cours".
-- Pas de rollback dédié : une fois statut recalculé depuis les vraies
-- formations, on ne peut plus distinguer "corrigé par ce script" de
-- "valeur déjà correcte" sans colonne d'audit dédiée — sauvegarder avant
-- exécution en environnement partagé (même limite que les autres
-- backfills de ce projet).

-- 1. Actif -> En formation
UPDATE identite.adherents a
SET statut = 'En formation'
WHERE a.statut = 'Actif'
  AND EXISTS (
    SELECT 1 FROM formation.formations f
    WHERE f.num_adherent = a.num_adherent AND f.statut = 'En cours'
  );

-- 2. En formation -> Actif
UPDATE identite.adherents a
SET statut = 'Actif'
WHERE a.statut = 'En formation'
  AND NOT EXISTS (
    SELECT 1 FROM formation.formations f
    WHERE f.num_adherent = a.num_adherent AND f.statut = 'En cours'
  );
