const express = require('express');
const router = express.Router();
const CertificatMedicalController = require('../controllers/CertificatMedicalController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const certificatController = new CertificatMedicalController();

router.get('/', certificatController.getAll.bind(certificatController));
router.get('/valid', certificatController.getValidCertificates.bind(certificatController));
router.get('/expired', certificatController.getExpiredCertificates.bind(certificatController));
router.get('/adherent/:num_adherent', certificatController.getByAdherent.bind(certificatController));
router.get('/adherent/:num_adherent/status', certificatController.checkStatus.bind(certificatController));
router.get('/:id', certificatController.getById.bind(certificatController));

router.post('/',
  AuthMiddleware.authenticate,
  certificatController.validateBeforeCreate.bind(certificatController),
  certificatController.create.bind(certificatController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  certificatController.update.bind(certificatController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  certificatController.delete.bind(certificatController)
);

module.exports = router;