-- La constitution automatique d'une palanquée (dès qu'un membre est pointé
-- présent) peut se produire sans qu'un moniteur soit identifiable (pointage
-- effectué par le président) : id_moniteur_encadrant doit pouvoir rester
-- vide jusqu'à assignation manuelle ultérieure (PATCH /palanquees/:id/encadrement).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-palanquee-encadrant-nullable.sql

ALTER TABLE activites.palanquees ALTER COLUMN id_moniteur_encadrant DROP NOT NULL;
