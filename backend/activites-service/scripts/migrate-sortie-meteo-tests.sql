-- Traçabilité des deux passages du test météo automatique sur une sortie
-- (voir SortieService.verifierMeteoEtAnnulerSiDangereux) :
--   - meteo_test_j3_fait : le test à J-3 (décision automatique : annule si
--     dangereux) a déjà été effectué pour cette sortie — évite de le
--     rejouer chaque jour tant que la sortie reste "Planifiée" dans la
--     fenêtre de la requête.
--   - meteo_alerte_j1_envoyee : le test à J-1 (alerte seulement, jamais
--     d'annulation automatique à ce stade — décision humaine) a déjà été
--     effectué pour cette sortie.
-- Sans ces deux colonnes, une même sortie serait retestée à chaque passage
-- du cron tant qu'elle reste dans la fenêtre, au lieu d'un test unique par
-- étape.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-meteo-tests.sql
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS meteo_test_j3_fait BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS meteo_alerte_j1_envoyee BOOLEAN NOT NULL DEFAULT false;
