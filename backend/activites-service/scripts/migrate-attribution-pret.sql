-- Gestion des prêts (CDC 3.4.4) : une attribution peut ne pas être liée à
-- une sortie (prêt libre entre deux sorties), et peut retenir une pièce
-- d'identité comme alternative à la caution en espèces.
ALTER TABLE activites.attributions ALTER COLUMN id_sortie DROP NOT NULL;
ALTER TABLE activites.attributions ADD COLUMN IF NOT EXISTS piece_identite_retenue VARCHAR(100);
