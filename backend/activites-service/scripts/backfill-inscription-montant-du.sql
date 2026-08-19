-- Backfill (données existantes, pas un changement de schéma) : corrige
-- inscriptions.montant_du, resté à NULL pour TOUTES les inscriptions créées
-- avant ce correctif — InscriptionRepository.create filtrait les données
-- écrites en base avec une liste blanche qui avait oublié montant_du (et
-- montant_paye/paye), si bien que le tarif calculé par InscriptionService
-- (computeMontantDu, voir utils/tarifRules.js) était systématiquement perdu
-- à l'écriture. Conséquence côté affichage (InscriptionDetails.jsx,
-- SortiesPage.jsx) : "Gratuit" pour absolument toutes les inscriptions,
-- même sur une sortie payante.
--
-- Ne touche QUE montant_du : montant_paye et paye peuvent avoir été mis à
-- jour légitimement depuis, par un vrai enregistrement de paiement
-- (InscriptionRepository.update, qui n'a pas ce bug) — les écraser
-- effacerait un paiement réel. montant_du, lui, n'est jamais modifié après
-- la création ("le tarif de la sortie est figé au moment de l'inscription",
-- voir le commentaire dans InscriptionService.create) : le recalculer à
-- l'identique de ce qu'aurait dû produire computeMontantDu est donc sans
-- risque, y compris pour une sortie déjà terminée.
--
-- Reproduit ici la même règle que computeMontantDu (tarifRules.js) :
-- tarif_non_adherent pour un invité (identite.adherents.est_invite), sinon
-- tarif_adherent, avec repli sur tarif_adherent si tarif_non_adherent n'est
-- pas renseigné.
--
-- Idempotent : ne touche que les lignes où montant_du est encore NULL.
--
-- Vérification avant application : compter les lignes concernées.
--   SELECT count(*) FROM activites.inscriptions WHERE montant_du IS NULL;
--
-- Pas de rollback dédié : une fois montant_du recalculé, on ne peut plus
-- distinguer "corrigé par ce script" de "valeur déjà correcte" sans colonne
-- d'audit dédiée. Sauvegarder avant exécution en environnement partagé.

-- Sous-requête keyée sur id_inscription (clé primaire) : Postgres n'autorise
-- pas de référencer la table cible d'UPDATE (i) à l'intérieur d'une clause
-- JOIN ON de la clause FROM, d'où le passage par une table dérivée plutôt
-- qu'un LEFT JOIN direct dans le FROM de l'UPDATE.
UPDATE activites.inscriptions i
SET montant_du = sub.nouveau_montant
FROM (
  SELECT i2.id_inscription,
         CASE
           WHEN COALESCE(ad.est_invite, false) AND s.tarif_non_adherent IS NOT NULL
             THEN s.tarif_non_adherent
           ELSE COALESCE(s.tarif_adherent, 0)
         END AS nouveau_montant
  FROM activites.inscriptions i2
  JOIN activites.sorties s ON s.id_sortie = i2.id_sortie
  LEFT JOIN identite.adherents ad ON ad.num_adherent = i2.num_adherent
  WHERE i2.montant_du IS NULL
) sub
WHERE i.id_inscription = sub.id_inscription;
