-- Complète migrate-sortie-meteo-tests.sql : la décision automatique ne
-- repose plus sur un test unique à J-3, mais sur 3 tests espacés sur 3
-- jours différents (J-5, J-4, J-3) — "dangereux" dès qu'au moins un des
-- trois l'a détecté (voir SortieService.testerUneEtapeAuto).
--   - meteo_test_j5_fait / meteo_test_j4_fait : les deux premiers des 3
--     tests (meteo_test_j3_fait existe déjà depuis la v1 — il désigne
--     maintenant le 3e et dernier test, celui qui déclenche la décision).
--   - meteo_motifs_detectes : motifs accumulés au fil des 3 tests (JSON,
--     vide/null tant qu'aucun test n'a rien détecté) — sert à figer le
--     motif_annulation final si la décision est d'annuler.
--
-- Usage : psql -U postgres -d plongee_db -f migrate-sortie-meteo-tests-v2.sql
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS meteo_test_j5_fait BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS meteo_test_j4_fait BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE activites.sorties ADD COLUMN IF NOT EXISTS meteo_motifs_detectes JSON;
