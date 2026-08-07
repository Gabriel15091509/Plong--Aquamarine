const express = require('express');
const router = express.Router();
const CertificatMedicalController = require('../controllers/CertificatMedicalController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { uploadCertificatDocument, handleAnalysePhotoUpload } = require('../middlewares/upload');
const { ROLES } = require('../utils/roleScope');

const certificatController = new CertificatMedicalController();

router.get('/', AuthMiddleware.authenticate, certificatController.getAll.bind(certificatController));
router.get('/valid', AuthMiddleware.authenticate, certificatController.getValidCertificates.bind(certificatController));
router.get('/expired', AuthMiddleware.authenticate, certificatController.getExpiredCertificates.bind(certificatController));
router.get('/expiring-soon', certificatController.getExpiringSoon.bind(certificatController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, certificatController.getByAdherent.bind(certificatController));
router.get('/adherent/:num_adherent/status', AuthMiddleware.authenticate, certificatController.checkStatus.bind(certificatController));
router.get('/:id', AuthMiddleware.authenticate, certificatController.getById.bind(certificatController));
router.get('/:id/document', AuthMiddleware.authenticate, certificatController.downloadDocument.bind(certificatController));

// Ouvert à l'adhérent aussi : c'est lui qui déclenche l'analyse OCR en
// choisissant/prenant sa photo dans CertificatForm.jsx lors d'une
// auto-soumission (voir POST / plus bas) — sans quoi le simple fait de
// sélectionner un fichier renvoyait 403 avant même la création.
router.post('/analyser-photo',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize([...ROLES.PRESIDENT_ONLY, 'adherent']),
  handleAnalysePhotoUpload,
  certificatController.analysePhoto.bind(certificatController)
);

// Le staff (PRESIDENT_ONLY, comme avant) ET l'adhérent peuvent créer un
// certificat : un adhérent qui soumet le sien reste "En attente" jusqu'à
// validation (POST /:id/valider), un staff qui le crée est "Validé"
// d'office — même schéma que adhesionRoutes.js.
router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize([...ROLES.PRESIDENT_ONLY, 'adherent']),
  ...uploadCertificatDocument,
  certificatController.validateBeforeCreate.bind(certificatController),
  certificatController.create.bind(certificatController)
);

router.post('/:id/valider',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  certificatController.valider.bind(certificatController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  ...uploadCertificatDocument,
  certificatController.update.bind(certificatController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  certificatController.delete.bind(certificatController)
);

module.exports = router;
