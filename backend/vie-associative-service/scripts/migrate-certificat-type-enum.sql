\encoding UTF8

-- Aligne type_certificat sur les 4 types du CDC 3.1.3 (sportif / plongée /
-- généraliste / médecin hyperbare) : le champ était un STRING libre où
-- "Médical" et "Révision" s'étaient glissés au fil du seed/saisie sans
-- corresponder à la nomenclature attendue. Remappés avant conversion en
-- ENUM : Médical -> Généraliste (certificat de non-contre-indication
-- générique), Révision -> Médecin hyperbare (visite de suivi spécialisée).
UPDATE vie_associative.certificats_medicaux
SET type_certificat = 'Généraliste'
WHERE type_certificat = 'Médical';

UPDATE vie_associative.certificats_medicaux
SET type_certificat = 'Médecin hyperbare'
WHERE type_certificat = 'Révision';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_certificats_medicaux_type_certificat') THEN
    CREATE TYPE enum_certificats_medicaux_type_certificat AS ENUM (
      'Sportif', 'Plongée', 'Généraliste', 'Médecin hyperbare'
    );
  END IF;
END$$;

ALTER TABLE vie_associative.certificats_medicaux
  ALTER COLUMN type_certificat TYPE enum_certificats_medicaux_type_certificat
  USING type_certificat::enum_certificats_medicaux_type_certificat;
