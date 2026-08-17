-- Motif d'annulation d'une sortie (renseigné automatiquement par
-- SortieService.verifierMeteoEtAnnulerSiDangereux quand la météo prévue est
-- jugée dangereuse — vent, houle, orage, fortes précipitations) : sans ce
-- champ, un adhérent/organisateur voyant "Annulée" n'a aucun moyen de savoir
-- pourquoi.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-motif-annulation.sql
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS motif_annulation TEXT;
