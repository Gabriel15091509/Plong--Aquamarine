// Version vie-associative-service de middlewares/upload.js : ne garde que
// les uploaders de ce domaine (adhésions, certificats médicaux) — l'upload
// de photo de profil (`uploadUserPhoto`) reste dans le monolithe/
// identite-service, propriétaire du compte User partagé.
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { encryptBuffer, decryptBuffer } = require("../utils/crypto");
const objectStorage = require("../utils/objectStorage");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");
// Racine distincte, jamais montée par `express.static` (voir app.js) : les
// documents médicaux ne doivent pas pouvoir être atteints par une simple
// requête HTTP publique, chiffrés ou non. Utilisée uniquement en repli
// disque local (R2 non configuré) — voir objectStorage.js.
const SECURE_UPLOADS_ROOT = path.join(__dirname, "../../secure-uploads");

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 Mo

function makeUploader(
  subfolder,
  {
    fileField = "document",
    bodyKey = "document_path",
    allowedMimetypes = ALLOWED_MIMETYPES,
    errorMessage = "Format de fichier non autorisé (image ou PDF uniquement)",
    encrypt = false,
  } = {},
) {
  // Toujours en mémoire (que ce soit pour chiffrer avant écriture, ou pour
  // choisir R2 vs disque local une fois le buffer en main).
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (!allowedMimetypes.includes(file.mimetype)) {
        return cb(new Error(errorMessage));
      }
      cb(null, true);
    },
  }).single(fileField);

  const attachFilePath = async (req, res, next) => {
    if (!req.file) return next();

    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    try {
      if (!encrypt) {
        // Document public (adhésion) : même logique que
        // identite-service/materiel-service — URL R2 complète en base si
        // configuré, sinon chemin relatif servi par express.static.
        if (objectStorage.isConfigured) {
          req.body[bodyKey] = await objectStorage.uploadBuffer(
            `${subfolder}/${filename}`,
            req.file.buffer,
            req.file.mimetype,
          );
        } else {
          const destination = path.join(UPLOADS_ROOT, subfolder);
          fs.mkdirSync(destination, { recursive: true });
          fs.writeFileSync(path.join(destination, filename), req.file.buffer);
          req.body[bodyKey] = `/uploads/${subfolder}/${filename}`;
        }
        return next();
      }

      // Document chiffré (certificat médical) : le buffer chiffré part
      // vers R2 si configuré (clé "certificats/<fichier>", jamais rendue
      // publique — pas d'URL construite), sinon vers secure-uploads/ en
      // local. Dans les deux cas, seul le nom de fichier opaque est stocké
      // en base (pas d'URL) : le document ne se récupère que via la route
      // authentifiée dédiée (readEncryptedDocument), jamais en direct.
      // L'extension d'origine est conservée pour retrouver le
      // Content-Type au téléchargement (pas de colonne mimetype dédiée).
      const encrypted = encryptBuffer(req.file.buffer);
      if (objectStorage.isConfigured) {
        await objectStorage.uploadBuffer(`${subfolder}/${filename}`, encrypted);
      } else {
        const destination = path.join(SECURE_UPLOADS_ROOT, subfolder);
        fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.join(destination, filename), encrypted);
      }
      req.body[bodyKey] = filename;
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  const handleUpload = (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };

  return [handleUpload, attachFilePath];
}

// Lecture d'un document chiffré par son nom de fichier (utilisé par la
// route de téléchargement du certificat, jamais exposé directement). Même
// source que l'upload (R2 si configuré, sinon disque local) : les deux
// utilisent le même flag objectStorage.isConfigured, donc toujours
// cohérents pour un déploiement donné.
async function readEncryptedDocument(subfolder, filename) {
  const encrypted = objectStorage.isConfigured
    ? await objectStorage.downloadBuffer(`${subfolder}/${filename}`)
    : fs.readFileSync(path.join(SECURE_UPLOADS_ROOT, subfolder, filename));
  return decryptBuffer(encrypted);
}

// Lecture d'un document d'adhésion NON chiffré à partir du chemin stocké en
// base (URL R2 complète, ou `/uploads/adhesions/<fichier>` en local) —
// utilisé par AdhesionService.judgeSubmittedDocument (validation
// automatique Ollama), qui a besoin des octets bruts pour l'OCR, pas
// seulement de l'URL/chemin statique.
async function readAdhesionDocument(document_path) {
  if (/^https?:\/\//.test(document_path)) {
    // URL R2 publique complète : tout ce qui suit le nom du bucket dans le
    // chemin est la clé telle qu'uploadée (voir objectStorage.uploadBuffer).
    const key = document_path.replace(/^https?:\/\/[^/]+\//, "");
    return objectStorage.downloadBuffer(key);
  }
  const filename = path.basename(document_path);
  const filePath = path.join(UPLOADS_ROOT, "adhesions", filename);
  return fs.readFileSync(filePath);
}

// Photo envoyée uniquement pour l'analyse OCR de cohérence (pré-soumission
// du formulaire) : jamais écrite sur disque, ni chiffrée, ni conservée —
// le buffer sert une fois à l'analyse puis est jeté. Images uniquement (pas
// de PDF : l'OCR porte sur une photo prise à l'instant, pas un scan importé).
const analysePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seule une image peut être analysée"));
    }
    cb(null, true);
  },
}).single("photo");

function handleAnalysePhotoUpload(req, res, next) {
  analysePhotoUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}

module.exports = {
  uploadAdhesionDocument: makeUploader("adhesions"),
  uploadCertificatDocument: makeUploader("certificats", { encrypt: true }),
  readEncryptedDocument,
  readAdhesionDocument,
  handleAnalysePhotoUpload,
};
