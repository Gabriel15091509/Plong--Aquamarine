\encoding UTF8

-- Revert structurel uniquement : redevient un STRING libre. Le mapping
-- Médical/Révision -> Généraliste/Médecin hyperbare n'est PAS inversé (perte
-- d'info non récupérable, comme pour tout remap de données).
ALTER TABLE vie_associative.certificats_medicaux
  ALTER COLUMN type_certificat TYPE VARCHAR(30)
  USING type_certificat::text;

DROP TYPE IF EXISTS enum_certificats_medicaux_type_certificat;
