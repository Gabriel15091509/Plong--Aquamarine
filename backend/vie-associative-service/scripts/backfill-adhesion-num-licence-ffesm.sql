-- Backfill (données existantes, pas un changement de schéma) : reprend le
-- n° de licence FFESM déjà enregistré sur la fiche de l'adhérent
-- (identite.adherents.num_licence_ffesm, source de vérité — voir
-- AdhesionForm.jsx) pour les adhésions (vie_associative.adhesions) où ce
-- champ n'a jamais été renseigné. Corrige les lignes créées avant que
-- l'auto-remplissage n'existe côté formulaire, ou saisies manuellement sans
-- ce champ.
--
-- Idempotent et sans risque : ne touche que les lignes où
-- adhesions.num_licence_ffesm est NULL/vide, et seulement si l'adhérent a
-- bien un numéro enregistré ; ne modifie jamais une valeur déjà présente
-- (même une valeur différente de celle de l'adhérent — un désaccord
-- éventuel doit être vérifié par un humain, pas écrasé silencieusement).
--
-- Vérification avant application : compter les lignes concernées.
--   SELECT count(*) FROM vie_associative.adhesions a
--   JOIN identite.adherents ad ON a.num_adherent = ad.num_adherent
--   WHERE (a.num_licence_ffesm IS NULL OR TRIM(a.num_licence_ffesm) = '')
--     AND ad.num_licence_ffesm IS NOT NULL
--     AND TRIM(ad.num_licence_ffesm) != '';
--
-- Pas de rollback dédié : une fois la valeur recopiée, on ne peut plus
-- distinguer de façon fiable "cette ligne a été backfillée" de "cette valeur
-- a été saisie normalement entre-temps" sans colonne d'audit dédiée. Comme
-- pour toute modification de données en masse, prendre un dump/backup avant
-- exécution en environnement partagé (staging/prod) plutôt que de compter
-- sur un rollback SQL.

UPDATE vie_associative.adhesions a
SET num_licence_ffesm = ad.num_licence_ffesm
FROM identite.adherents ad
WHERE a.num_adherent = ad.num_adherent
  AND (a.num_licence_ffesm IS NULL OR TRIM(a.num_licence_ffesm) = '')
  AND ad.num_licence_ffesm IS NOT NULL
  AND TRIM(ad.num_licence_ffesm) != '';
