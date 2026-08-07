-- Le n° de licence FFESM est un identifiant personnel délivré une seule
-- fois par la fédération : deux adhérents ne peuvent légitimement pas en
-- partager un. NULL reste autorisé (adhérents Baptême, pas encore licenciés)
-- — une contrainte UNIQUE Postgres n'entre jamais en conflit sur plusieurs
-- NULL.
--
-- Vérifié avant migration (aucune ligne ne bloque l'ajout de la contrainte) :
--   SELECT num_licence_ffesm, count(*) FROM identite.adherents
--   WHERE num_licence_ffesm IS NOT NULL
--   GROUP BY num_licence_ffesm HAVING count(*) > 1;
--   -- 0 ligne au moment de cette migration
ALTER TABLE identite.adherents
  ADD CONSTRAINT adherents_num_licence_ffesm_key UNIQUE (num_licence_ffesm);
