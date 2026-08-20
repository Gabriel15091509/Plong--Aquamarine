-- Ajoute le snapshot du niveau de l'adhérent au moment où il rejoint une
-- palanquée (voir le commentaire sur Composer.niveau_au_moment) : sans lui,
-- le ratio encadrant/plongeur (règle RG5, 1/4 ou 1/6 selon computeMaxRatio)
-- était recalculé à chaque lecture avec le niveau ACTUEL de l'adhérent —
-- une palanquée clôturée depuis longtemps pouvait donc apparaître
-- rétroactivement conforme (ou non conforme) au ratio réellement respecté
-- le jour de la plongée, dès qu'un de ses membres changeait de niveau
-- ensuite.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-composer-niveau-au-moment.sql

ALTER TABLE activites.composer ADD COLUMN IF NOT EXISTS niveau_au_moment VARCHAR(20);

-- Backfill best-effort pour les lignes déjà existantes : reprend le niveau
-- ACTUEL de l'adhérent (identite-service), faute de mieux — ce n'est PAS
-- le niveau réel qu'il avait le jour de la plongée si celui-ci a changé
-- depuis. Accepté comme approximation ponctuelle (mieux qu'un NULL
-- indéfini) ; à partir de ce backfill, toute nouvelle ligne est renseignée
-- au vrai niveau de l'adhérent au moment de son ajout (voir
-- PalanqueeService.addMembre / autoConstituerPourPresence) et ne sera plus
-- jamais réécrite.
UPDATE activites.composer c
SET niveau_au_moment = a.niveau
FROM identite.adherents a
WHERE c.num_adherent = a.num_adherent
  AND c.niveau_au_moment IS NULL;
