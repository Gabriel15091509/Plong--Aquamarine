-- Un adhérent de niveau Baptême n'est pas licencié FFESM (dossier allégé,
-- cf. relaxation de checkDossierValidity côté activites-service pour ce
-- niveau : seule l'adhésion Club est exigée). Les lignes FFESM historiquement
-- seedées pour ce niveau sont donc incohérentes avec la règle métier et sont
-- supprimées ici.
DELETE FROM vie_associative.adhesions ad
USING identite.adherents a
WHERE ad.num_adherent = a.num_adherent
  AND a.niveau = 'Baptême'
  AND ad.type = 'FFESM';

-- Idem pour un n° de licence FFESM resté (à tort) sur une ligne Club d'un
-- adhérent Baptême (résidu de l'ancien seed qui le remplissait sur tous les
-- types sans distinction).
UPDATE vie_associative.adhesions ad
SET num_licence_ffesm = NULL
FROM identite.adherents a
WHERE ad.num_adherent = a.num_adherent
  AND a.niveau = 'Baptême'
  AND ad.num_licence_ffesm IS NOT NULL;
