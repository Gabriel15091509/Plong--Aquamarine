\encoding UTF8

-- Postgres ne permet pas de retirer une valeur d'ENUM : aucun rollback
-- structurel possible pour 'Materiel en retard' / 'Inactivite plongee'.
-- Seule option : supprimer les lignes générées par ces nouveaux crons.
DELETE FROM vie_associative.alertes
WHERE type IN ('Materiel en retard', 'Inactivite plongee');
