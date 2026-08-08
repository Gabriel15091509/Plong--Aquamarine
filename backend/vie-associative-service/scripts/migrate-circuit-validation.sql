\encoding UTF8

-- Colonnes du circuit de soumission adhérent / validation président,
-- ajoutées aux modèles Sequelize par b3d0fb3 (Adhesion) et 044a455
-- (CertificatMedical) sans migration correspondante — absentes en base,
-- ce qui fait planter AlerteService.syncExpirationAlertes() au démarrage
-- (SELECT sur statut_validation, colonne inexistante) et donc tout le
-- service (voir initializeApp -> process.exit(1)).
--
-- Mêmes colonnes, mêmes défauts sur les deux tables (schéma partagé
-- décrit dans les commentaires de CertificatMedical.js) : une ligne
-- existante (toujours créée par le staff avant ce circuit) est réputée
-- "Validé" et non soumise par un adhérent, donc reste modifiable comme
-- avant (défauts choisis pour ne rien verrouiller rétroactivement).
ALTER TABLE vie_associative.adhesions
  ADD COLUMN IF NOT EXISTS statut_validation VARCHAR(20) NOT NULL DEFAULT 'Validé',
  ADD COLUMN IF NOT EXISTS soumis_par_adherent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS valide_par INTEGER,
  ADD COLUMN IF NOT EXISTS valide_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motif_rejet VARCHAR(255);

ALTER TABLE vie_associative.certificats_medicaux
  ADD COLUMN IF NOT EXISTS statut_validation VARCHAR(20) NOT NULL DEFAULT 'Validé',
  ADD COLUMN IF NOT EXISTS soumis_par_adherent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS valide_par INTEGER,
  ADD COLUMN IF NOT EXISTS valide_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motif_rejet VARCHAR(255);
