-- Authentification renforcée du président (exigence 4.4) : code à usage
-- unique envoyé par email après email+mot de passe corrects, avant
-- délivrance du JWT. Colonnes ajoutées sur `users` (utilisées uniquement
-- pour le rôle président, mais pas de table dédiée pour rester cohérent
-- avec les autres champs ad hoc du modèle, ex. must_change_password).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-otp-president.sql

-- TIMESTAMPTZ (pas TIMESTAMP) : les autres colonnes DataTypes.DATE de ce
-- modèle (created_at, last_login) sont en `timestamp with time zone` ; avec
-- un simple TIMESTAMP, le driver pg réinterprète la valeur lue dans le
-- fuseau horaire local du process Node au lieu de l'UTC dans lequel elle a
-- été écrite, ce qui faisait apparaître le code OTP comme expiré dès sa
-- création.
ALTER TABLE identite.users ADD COLUMN IF NOT EXISTS otp_code_hash VARCHAR(255);
ALTER TABLE identite.users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE identite.users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE identite.users ALTER COLUMN otp_expires_at TYPE TIMESTAMPTZ USING otp_expires_at AT TIME ZONE 'UTC';
