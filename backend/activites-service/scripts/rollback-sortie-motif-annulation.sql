-- Usage : psql -U postgres -d plongee_db -f rollback-sortie-motif-annulation.sql
ALTER TABLE activites.sorties DROP COLUMN IF EXISTS motif_annulation;
