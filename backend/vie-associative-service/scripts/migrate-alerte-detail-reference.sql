\encoding UTF8

-- Ajoute de quoi distinguer précisément la ligne (Adhesion ou
-- CertificatMedical) à l'origine d'une alerte automatique, et un libellé
-- affichable de ce qui expire/manque exactement — voir le commentaire sur
-- Alerte.reference_type/reference_id/detail dans le modèle. Sans ça,
-- AlerteService.upsertAutomaticAlerte ne pouvait dédupliquer que par
-- (num_adherent, type générique) : deux adhésions différentes du même
-- adhérent expirant la même semaine (ex. Licence FFESM et Assurance RC)
-- convergeaient vers une seule ligne, la seconde écrasant silencieusement
-- la trace de la première.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-alerte-detail-reference.sql

ALTER TABLE vie_associative.alertes ADD COLUMN IF NOT EXISTS detail VARCHAR(100);
ALTER TABLE vie_associative.alertes ADD COLUMN IF NOT EXISTS reference_type VARCHAR(30);
ALTER TABLE vie_associative.alertes ADD COLUMN IF NOT EXISTS reference_id INTEGER;

-- Pas de backfill : impossible de reconstituer après coup, pour une alerte
-- déjà en base, laquelle des adhésions du même adhérent l'a réellement
-- déclenchée si plusieurs étaient candidates au moment de sa création. Les
-- alertes déjà existantes restent avec ces 3 colonnes à NULL (comportement
-- de dédup identique à avant pour elles) ; toute nouvelle synchronisation
-- (syncExpirationAlertes) les renseigne correctement à partir de maintenant.
