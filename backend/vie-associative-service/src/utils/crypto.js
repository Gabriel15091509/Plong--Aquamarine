// Chiffrement au repos des documents médicaux (certificats médicaux —
// exigence 4.4). AES-256-GCM : authentifié (un fichier altéré ou une
// mauvaise clé fait échouer le déchiffrement au lieu de rendre des données
// corrompues silencieusement). Format du fichier stocké : IV (12) ||
// authTag (16) || ciphertext.
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getKey = () => {
  const secret = process.env.CERTIFICAT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CERTIFICAT_ENCRYPTION_KEY non configurée");
  }
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error(
      "CERTIFICAT_ENCRYPTION_KEY doit décoder en 32 octets (AES-256) en base64",
    );
  }
  return key;
};

const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
};

const decryptBuffer = (encrypted) => {
  const iv = encrypted.subarray(0, IV_LENGTH);
  const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

module.exports = { encryptBuffer, decryptBuffer };
