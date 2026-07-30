-- Ajoute le nombre de séances prévues sur une formation, nécessaire pour
-- savoir quand elle est réellement terminée (auto-complétion + garde-fou sur
-- le bouton "Terminer"). Nullable : les formations existantes n'ont pas de
-- cible connue, elles ne seront ni bloquées ni auto-complétées sur ce critère.
ALTER TABLE formation.formations ADD COLUMN IF NOT EXISTS nb_seances_prevues INTEGER;
