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

router.post('/analyser-photo',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  handleAnalysePhotoUpload,
  certificatController.analysePhoto.bind(certificatController)
);

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  ...uploadCertificatDocument,
  certificatController.validateBeforeCreate.bind(certificatController),
  certificatController.create.bind(certificatController)
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
