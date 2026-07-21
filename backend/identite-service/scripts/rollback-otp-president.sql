ALTER TABLE identite.users DROP COLUMN IF EXISTS otp_code_hash;
ALTER TABLE identite.users DROP COLUMN IF EXISTS otp_expires_at;
ALTER TABLE identite.users DROP COLUMN IF EXISTS otp_attempts;
