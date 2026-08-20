-- Backfill (données existantes, pas un changement de schéma) : suite de
-- backfill-inscription-montant-du.sql. Une fois montant_du corrigé (n'était
-- plus NULL pour aucune inscription), il est apparu que la colonne `paye`
-- ne correspond plus, pour une bonne partie des inscriptions déjà en base,
-- à la réalité montant_paye / montant_du — visible côté écran par un
-- "Montant dû" affiché alors que le statut annonçait "Payé" (ou l'inverse).
--
-- Cause : `paye` avait été renseigné par le script de seed (données de
-- démo) indépendamment de tout vrai montant_du, puisque montant_du était
-- NULL en base pour toutes les inscriptions à ce moment-là (voir le
-- backfill précédent) — les deux valeurs n'ont jamais été mises en
-- cohérence tant que montant_du restait NULL.
--
-- Le vrai flux d'enregistrement d'un paiement (InscriptionService.
-- enregistrerPaiement) calcule déjà `paye` correctement à chaque paiement
-- réel : `montantDu > 0 ? nouveauMontantPaye >= montantDu : true` — non
-- affecté par le bug de la liste blanche (passe par
-- InscriptionRepository.update, pas create). Ce backfill applique
-- exactement la même règle, une seule fois, aux lignes déjà incohérentes.
--
-- Ne touche que `paye` : montant_paye n'est jamais modifié ici, c'est la
-- valeur qu'on considère vraie (potentiellement un vrai paiement
-- enregistré) — seul le booléen dérivé était faux.
--
-- Idempotent : ne touche que les lignes où paye ne correspond pas déjà à
-- (montant_paye >= montant_du).
--
-- Vérification avant application :
--   SELECT count(*) FROM activites.inscriptions
--   WHERE paye <> (montant_paye >= montant_du);
--
-- Pas de rollback dédié, même raison que le backfill précédent : sauvegarder
-- avant exécution en environnement partagé.

UPDATE activites.inscriptions
SET paye = (montant_paye >= montant_du)
WHERE paye <> (montant_paye >= montant_du);
