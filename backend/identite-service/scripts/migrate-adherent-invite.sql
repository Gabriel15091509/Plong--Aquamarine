\encoding UTF8

-- Un adhérent "invité" (CDC 3.2.1 : tarif de sortie adhérent vs non-adhérent)
-- : une fiche créée par le staff pour une personne qui n'est pas (encore)
-- membre du club, ex. un invité venu essayer un baptême. Il passe par
-- exactement le même parcours (compte, adhésion Club, certificat médical,
-- inscription) qu'un adhérent normal — seule la colonne ci-dessous change le
-- tarif appliqué à ses inscriptions (voir activites-service/src/utils/
-- tarifRules.js) et l'exclut des statistiques d'adhérents actifs et de la
-- communication ciblée (CDC 3.6.1/3.6.2).
ALTER TABLE identite.adherents ADD COLUMN IF NOT EXISTS est_invite BOOLEAN NOT NULL DEFAULT false;
