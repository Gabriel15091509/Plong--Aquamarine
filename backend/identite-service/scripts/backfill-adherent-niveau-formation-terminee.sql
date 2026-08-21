\encoding UTF8

-- Constat : les 31 formations "Terminée" du jeu de données de démo
-- (seedFormation.js) n'avaient jamais répercuté le niveau obtenu sur
-- l'adhérent — ex. une formation visant N3 marquée "Terminée" alors que
-- l'adhérent restait affiché "Niveau 2" dans la liste des adhérents.
--
-- Cause : seedFormation.js insère directement les lignes Formation en
-- base (Sequelize), sans passer par FormationService.completeFormation
-- — c'est CETTE méthode qui, en usage réel, répercute le niveau sur
-- identite.adherents (via identiteClient.updateNiveau) au moment où une
-- formation passe "Terminée". Le générateur de seed n'a jamais rejoué
-- cette étape.
--
-- Ce script fait, pour chaque adhérent concerné, ce que
-- completeFormation aurait fait en conditions réelles :
--  1. Ajoute une ligne d'historique dans identite.brevets (même table
--     que Brevet.create dans AdherentService.updateNiveau), avec pour
--     date_obtention le date_fin_reelle de la formation (la plus
--     ancienne si l'adhérent a plusieurs formations "Terminée"
--     dupliquées visant le même niveau — vérifié qu'aucun adhérent de ce
--     jeu de données n'a de vraie progression séquentielle à plusieurs
--     niveaux à reconstituer, seulement des doublons du même niveau visé).
--  2. Met à jour identite.adherents.niveau / date_obtention_niveau —
--     seulement si le niveau obtenu par la formation est réellement
--     supérieur au niveau actuellement affiché (idempotent : ne
--     redescend jamais, ne touche pas un adhérent déjà à jour).
--
-- Ne touche jamais num_brevet/num_licence_ffesm : aucune donnée fiable
-- de ce type dans le seed de formation, laissés tels quels (comme un
-- passage automatique réel via tryAutoComplete, où personne ne connaît
-- encore les numéros délivrés — voir le commentaire équivalent dans
-- AdherentService.updateNiveau).
--
-- Vérification avant application :
--   SELECT f.id_formation, f.num_adherent, f.niveau_vise, a.niveau
--   FROM formation.formations f
--   JOIN identite.adherents a ON a.num_adherent = f.num_adherent
--   WHERE f.statut = 'Terminée';
--   -- (comparer f.niveau_vise traduit et a.niveau à l'oeil, voir la
--   -- table de correspondance ci-dessous)
--
-- Idempotent : ne réinsère pas un brevet déjà présent pour ce niveau,
-- ne met à jour que si le niveau obtenu dépasse le niveau actuel.
-- Pas de rollback dédié : une fois le niveau recalculé, on ne peut plus
-- distinguer "corrigé par ce script" de "valeur déjà correcte" sans
-- colonne d'audit dédiée — sauvegarder avant exécution en environnement
-- partagé (même limite que les autres backfills de ce projet).

WITH echelle(niveau, rang) AS (
  VALUES
    ('Baptême', 0), ('Niveau 1', 1), ('Niveau 2', 2),
    ('Niveau 3', 3), ('Niveau 4', 4), ('Moniteur', 5)
),
obtenu(niveau_vise, niveau_obtenu) AS (
  VALUES
    ('N1', 'Niveau 1'), ('N2', 'Niveau 2'), ('N3', 'Niveau 3'),
    ('N4', 'Niveau 4'), ('MF1', 'Moniteur')
),
promotions AS (
  SELECT DISTINCT ON (f.num_adherent)
    f.num_adherent,
    o.niveau_obtenu,
    f.date_fin_reelle
  FROM formation.formations f
  JOIN obtenu o ON o.niveau_vise = f.niveau_vise
  JOIN identite.adherents a ON a.num_adherent = f.num_adherent
  JOIN echelle e_actuel ON e_actuel.niveau = a.niveau::text
  JOIN echelle e_obtenu ON e_obtenu.niveau = o.niveau_obtenu
  WHERE f.statut = 'Terminée'
    AND e_actuel.rang < e_obtenu.rang
  ORDER BY f.num_adherent, f.date_fin_reelle ASC
)
INSERT INTO identite.brevets (num_adherent, niveau, date_obtention, created_at, updated_at)
SELECT p.num_adherent, p.niveau_obtenu, p.date_fin_reelle, now(), now()
FROM promotions p
WHERE NOT EXISTS (
  SELECT 1 FROM identite.brevets b
  WHERE b.num_adherent = p.num_adherent AND b.niveau::text = p.niveau_obtenu
);

WITH echelle(niveau, rang) AS (
  VALUES
    ('Baptême', 0), ('Niveau 1', 1), ('Niveau 2', 2),
    ('Niveau 3', 3), ('Niveau 4', 4), ('Moniteur', 5)
),
obtenu(niveau_vise, niveau_obtenu) AS (
  VALUES
    ('N1', 'Niveau 1'), ('N2', 'Niveau 2'), ('N3', 'Niveau 3'),
    ('N4', 'Niveau 4'), ('MF1', 'Moniteur')
),
promotions AS (
  SELECT DISTINCT ON (f.num_adherent)
    f.num_adherent,
    o.niveau_obtenu,
    f.date_fin_reelle
  FROM formation.formations f
  JOIN obtenu o ON o.niveau_vise = f.niveau_vise
  JOIN identite.adherents a ON a.num_adherent = f.num_adherent
  JOIN echelle e_actuel ON e_actuel.niveau = a.niveau::text
  JOIN echelle e_obtenu ON e_obtenu.niveau = o.niveau_obtenu
  WHERE f.statut = 'Terminée'
    AND e_actuel.rang < e_obtenu.rang
  ORDER BY f.num_adherent, f.date_fin_reelle ASC
)
UPDATE identite.adherents a
SET niveau = p.niveau_obtenu::"enum_adherents_niveau",
    date_obtention_niveau = p.date_fin_reelle
FROM promotions p
WHERE a.num_adherent = p.num_adherent;
