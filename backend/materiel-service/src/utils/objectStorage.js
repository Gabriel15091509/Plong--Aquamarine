// Stockage persistant optionnel (Cloudflare R2, API compatible S3) pour les
// fichiers uploadés — sans ça, tout ce qui est écrit sur le disque local du
// service (multer.diskStorage, voir middlewares/upload.js) disparaît au
// prochain redéploiement sur Render (disque éphémère, plan gratuit).
//
// Actif seulement si R2_* est entièrement configuré (voir .env.example) ;
// sinon, comportement inchangé : fichiers sur disque local (dev, ou tant
// que R2 n'est pas configuré) — même principe de dégradation propre que
// GROQ_API_KEY/OVH_SMS_* ailleurs dans l'appli, jamais une exigence dure.
//
// Pas de package partagé entre services (convention déjà établie dans ce
// dépôt, voir le commentaire en tête de middlewares/upload.js) : ce fichier
// est dupliqué à l'identique dans identite-service, materiel-service et
// vie-associative-service.
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
// URL publique du bucket (ex. https://pub-xxxxxxxx.r2.dev, ou un domaine
// personnalisé) — sert à construire l'URL renvoyée au frontend pour les
// fichiers publics (avatars, photos matériel, documents d'adhésion). Sans
// objet pour les documents chiffrés (certificats), jamais servis en direct.
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

const isConfigured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME,
);

const client = isConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

// Envoie un buffer sous la clé donnée (ex. "avatars/172839-123.jpg") et
// renvoie l'URL publique complète à stocker en base.
async function uploadBuffer(key, buffer, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

// Relit un objet (utilisé pour les documents chiffrés, jamais servis en
// direct, et pour l'OCR d'adhésion qui a besoin des octets bruts).
async function downloadBuffer(key) {
  const response = await client.send(
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
  );
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = { isConfigured, uploadBuffer, downloadBuffer };
