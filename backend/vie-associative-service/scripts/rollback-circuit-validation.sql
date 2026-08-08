\encoding UTF8

-- Revert de migrate-circuit-validation.sql. Perte de données pour toute
-- soumission adhérent déjà enregistrée (soumis_par_adherent, valide_par,
-- valide_le, motif_rejet) — comme pour tout rollback structurel de ce
-- dépôt, acceptable uniquement si ce circuit n'a jamais été utilisé.
ALTER TABLE vie_associative.adhesions
  DROP COLUMN IF EXISTS statut_validation,
  DROP COLUMN IF EXISTS soumis_par_adherent,
  DROP COLUMN IF EXISTS valide_par,
  DROP COLUMN IF EXISTS valide_le,
  DROP COLUMN IF EXISTS motif_rejet;

ALTER TABLE vie_associative.certificats_medicaux
  DROP COLUMN IF EXISTS statut_validation,
  DROP COLUMN IF EXISTS soumis_par_adherent,
  DROP COLUMN IF EXISTS valide_par,
  DROP COLUMN IF EXISTS valide_le,
  DROP COLUMN IF EXISTS motif_rejet;
