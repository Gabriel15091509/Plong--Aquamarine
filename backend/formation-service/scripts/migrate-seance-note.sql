-- Ajoute la note /20 attribuée au pointage de présence d'une séance (voir
-- SeanceService.updateStatut) — facultative, sert à calculer une moyenne
-- indicative une fois toutes les séances réalisées (proposition
-- d'appréciation moniteur, jamais une décision automatique).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-seance-note.sql

ALTER TABLE formation.seances ADD COLUMN IF NOT EXISTS note DECIMAL(4,2);
