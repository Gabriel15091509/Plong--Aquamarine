-- Un brouillon de plongée est désormais créé automatiquement dès qu'un
-- membre est pointé présent sur une sortie (voir
-- PalanqueeService.creerPlongeeBrouillon) : profondeur/durée ne sont pas
-- encore connues à ce moment-là, seulement une fois saisies par le
-- moniteur (PalanqueeCard "Saisir les données" / enregistrerDonneesPlongee).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-plongee-nullable-mesures.sql

ALTER TABLE activites.plongees ALTER COLUMN profondeur_max DROP NOT NULL;
ALTER TABLE activites.plongees ALTER COLUMN duree DROP NOT NULL;
