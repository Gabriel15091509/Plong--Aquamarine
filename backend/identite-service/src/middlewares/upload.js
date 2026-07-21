// Version identite-service de middlewares/upload.js : ne garde que l'upload
// de photo de profil (tous rôles confondus, sur le compte User partagé) —
// les uploads d'adhésion/certificat vivent désormais dans
// vie-associative-service.
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");
const IMAGE_MIMETYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 Mo

function makeUploader(
  subfolder,
  {
    fileField = "document",
    bodyKey = "document_path",
    allowedMimetypes,
    errorMessage = "Format de fichier non autorisé",
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
  uploadUserPhoto: makeUploader("avatars", {
    fileField: "photo",
    bodyKey: "photo_path",
    allowedMimetypes: IMAGE_MIMETYPES,
    errorMessage: "Format de fichier non autorisé (image uniquement : JPEG, PNG, WEBP)",
  }),
};
