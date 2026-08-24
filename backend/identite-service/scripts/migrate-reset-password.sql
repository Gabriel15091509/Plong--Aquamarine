-- Mot de passe oublié (lien "Mot de passe oublié ?" de LoginPage.jsx, resté
-- un lien mort href="#" jusqu'ici) : jeton d'usage unique envoyé par email,
-- vérifié côté serveur avant d'autoriser la définition d'un nouveau mot de
-- passe. Colonnes ajoutées sur `users`, même approche ad hoc que
-- must_change_password/otp_* plutôt qu'une table dédiée.
--
-- reset_token_hash stocke un SHA-256 du jeton (pas bcrypt comme otp_code_hash :
-- le jeton est déjà 32 octets aléatoires — donc à haute entropie, contrairement
-- au code OTP à 6 chiffres — un hash déterministe suffit et permet de
-- retrouver l'utilisateur par une recherche directe WHERE reset_token_hash = ...
-- au lieu de comparer un bcrypt contre chaque compte qui a un jeton actif).
--
-- Usage : psql -U postgres -d plongee_db -f migrate-reset-password.sql

ALTER TABLE identite.users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255);
-- TIMESTAMPTZ (pas TIMESTAMP) : même raison que otp_expires_at dans
-- migrate-otp-president.sql (sinon le driver pg réinterprète la valeur dans
-- le fuseau horaire local du process au lieu de l'UTC d'origine).
ALTER TABLE identite.users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;
