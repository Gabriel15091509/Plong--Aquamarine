-- Backfill (données existantes, pas un changement de schéma) : sens inverse
-- de backfill-adhesion-num-licence-ffesm.sql (vie-associative-service).
--
-- Ici la source de vérité est l'adhésion FFESM elle-même (le document
-- réellement soumis et validé par le président porte le vrai numéro de
-- licence) : on reprend identite.adherents.num_licence_ffesm depuis la
-- dernière adhésion de type FFESM validée (vie_associative.adhesions) de
-- chaque adhérent, qu'il ait déjà une valeur différente ou aucune — l'écart
-- constaté vient de données saisies indépendamment des deux côtés avant
-- cette réconciliation, pas d'une correction ponctuelle à la main qu'il
-- faudrait préserver.
--
-- "Dernière adhésion" = id_adhesion le plus élevé, en cas de renouvellement
-- (plusieurs adhésions FFESM validées pour le même adhérent au fil des
-- années) — vérifié au préalable qu'aucun adhérent n'a deux adhésions FFESM
-- validées avec des numéros différents (aucun cas en dev au moment de ce
-- script) ; si un tel cas apparaît un jour, DISTINCT ON choisira la plus
-- récente sans lever d'erreur.
--
-- Attention contrainte unique : identite.adherents.num_licence_ffesm est
-- UNIQUE (adherents_num_licence_ffesm_key). Vérifier avant application
-- qu'aucune des nouvelles valeurs n'appartient déjà à un AUTRE adhérent :
--
--   SELECT src.num_adherent, src.num_licence_ffesm, conflit.num_adherent
--   FROM (
--     SELECT DISTINCT ON (num_adherent) num_adherent, num_licence_ffesm
--     FROM vie_associative.adhesions
--     WHERE type = 'FFESM' AND statut_validation = 'Validé'
--       AND num_licence_ffesm IS NOT NULL AND TRIM(num_licence_ffesm) != ''
--     ORDER BY num_adherent, id_adhesion DESC
--   ) src
--   JOIN identite.adherents conflit
--     ON conflit.num_licence_ffesm = src.num_licence_ffesm
--     AND conflit.num_adherent != src.num_adherent;
--
-- Un résultat non vide signale un vrai conflit entre deux adhérents à
-- trancher à la main (laquelle des deux soumissions est la bonne) — ne pas
-- exécuter l'UPDATE tel quel dans ce cas, il échouerait de toute façon sur
-- la contrainte unique dès la première ligne concernée.
--
-- Pas de rollback dédié (comme pour l'autre sens) : sauvegarder avant
-- exécution en environnement partagé plutôt que de compter sur un rollback
-- SQL, on ne peut pas distinguer après coup "backfillé" de "saisi entre
-- temps".

UPDATE identite.adherents ad
SET num_licence_ffesm = src.num_licence_ffesm
FROM (
  SELECT DISTINCT ON (num_adherent) num_adherent, num_licence_ffesm
  FROM vie_associative.adhesions
  WHERE type = 'FFESM'
    AND statut_validation = 'Validé'
    AND num_licence_ffesm IS NOT NULL
    AND TRIM(num_licence_ffesm) != ''
  ORDER BY num_adherent, id_adhesion DESC
) src
WHERE ad.num_adherent = src.num_adherent
  AND ad.num_licence_ffesm IS DISTINCT FROM src.num_licence_ffesm;
