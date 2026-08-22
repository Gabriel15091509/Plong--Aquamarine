// Version materiel-service de middlewares/upload.js : photo de l'équipement,
// même pattern que identite-service/src/middlewares/upload.js (multer, pas de
// package partagé entre services — convention déjà établie dans ce dépôt).
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const objectStorage = require("../utils/objectStorage");

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
  // Toujours en mémoire : que la destination finale soit R2 ou le disque
  // local, on a besoin du buffer complet avant de savoir où l'écrire (voir
  // objectStorage.isConfigured plus bas).
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
      if (objectStorage.isConfigured) {
        // R2 configuré (production) : stockage persistant, survit aux
        // redéploiements — voir objectStorage.js pour le détail. L'URL
        // publique complète est stockée telle quelle en base ; le
        // frontend (utils/photoUrl.js) l'utilise sans transformation.
        req.body[bodyKey] = await objectStorage.uploadBuffer(
          `${subfolder}/${filename}`,
          req.file.buffer,
          req.file.mimetype,
        );
      } else {
        // Repli disque local (dev, ou tant que R2 n'est pas configuré) :
        // comportement historique, chemin relatif servi par express.static.
        const destination = path.join(UPLOADS_ROOT, subfolder);
        fs.mkdirSync(destination, { recursive: true });
        fs.writeFileSync(path.join(destination, filename), req.file.buffer);
        req.body[bodyKey] = `/uploads/${subfolder}/${filename}`;
      }
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

module.exports = {
  uploadMaterielPhoto: makeUploader("materiels", {
    fileField: "photo",
    bodyKey: "photo_path",
    allowedMimetypes: IMAGE_MIMETYPES,
    errorMessage: "Format de fichier non autorisé (image uniquement : JPEG, PNG, WEBP)",
  }),
};
