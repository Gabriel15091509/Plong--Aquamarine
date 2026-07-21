// Version vie-associative-service de middlewares/upload.js : ne garde que
// les uploaders de ce domaine (adhésions, certificats médicaux) — l'upload
// de photo de profil (`uploadUserPhoto`) reste dans le monolithe/
// identite-service, propriétaire du compte User partagé.
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { encryptBuffer, decryptBuffer } = require("../utils/crypto");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");
// Racine distincte, jamais montée par `express.static` (voir app.js) : les
// documents médicaux ne doivent pas pouvoir être atteints par une simple
// requête HTTP publique, chiffrés ou non.
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
  const upload = encrypt
    ? multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (req, file, cb) => {
          if (!allowedMimetypes.includes(file.mimetype)) {
            return cb(new Error(errorMessage));
          }
          cb(null, true);
        },
      }).single(fileField)
    : (() => {
        const destination = path.join(UPLOADS_ROOT, subfolder);
        fs.mkdirSync(destination, { recursive: true });
        const storage = multer.diskStorage({
          destination: (req, file, cb) => cb(null, destination),
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
          },
        });
        return multer({
          storage,
          limits: { fileSize: MAX_FILE_SIZE },
          fileFilter: (req, file, cb) => {
            if (!allowedMimetypes.includes(file.mimetype)) {
              return cb(new Error(errorMessage));
            }
            cb(null, true);
          },
        }).single(fileField);
      })();

  const attachFilePath = (req, res, next) => {
    if (!req.file) return next();

    if (!encrypt) {
      req.body[bodyKey] = `/uploads/${subfolder}/${req.file.filename}`;
      return next();
    }

    try {
      const destination = path.join(SECURE_UPLOADS_ROOT, subfolder);
      fs.mkdirSync(destination, { recursive: true });
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      fs.writeFileSync(
        path.join(destination, filename),
        encryptBuffer(req.file.buffer),
      );
      // Nom de fichier opaque uniquement (pas d'URL) : le document ne se
      // récupère que via la route authentifiée dédiée, jamais en direct.
      // L'extension d'origine est conservée pour retrouver le Content-Type
      // au téléchargement (pas de colonne mimetype dédiée).
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
// route de téléchargement du certificat, jamais exposé directement).
function readEncryptedDocument(subfolder, filename) {
  const filePath = path.join(SECURE_UPLOADS_ROOT, subfolder, filename);
  return decryptBuffer(fs.readFileSync(filePath));
}

module.exports = {
  uploadAdhesionDocument: makeUploader("adhesions"),
  uploadCertificatDocument: makeUploader("certificats", { encrypt: true }),
  readEncryptedDocument,
};
