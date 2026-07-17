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
