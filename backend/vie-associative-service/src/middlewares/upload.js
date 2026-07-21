// Version vie-associative-service de middlewares/upload.js : ne garde que
// les uploaders de ce domaine (adhésions, certificats médicaux) — l'upload
// de photo de profil (`uploadUserPhoto`) reste dans le monolithe/
// identite-service, propriétaire du compte User partagé.
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");

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
  } = {},
) {
  const destination = path.join(UPLOADS_ROOT, subfolder);
  fs.mkdirSync(destination, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destination),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (!allowedMimetypes.includes(file.mimetype)) {
        return cb(new Error(errorMessage));
      }
      cb(null, true);
    },
  }).single(fileField);

  const attachFilePath = (req, res, next) => {
    if (req.file) {
      req.body[bodyKey] = `/uploads/${subfolder}/${req.file.filename}`;
    }
    next();
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

module.exports = {
  uploadAdhesionDocument: makeUploader("adhesions"),
  uploadCertificatDocument: makeUploader("certificats"),
};
