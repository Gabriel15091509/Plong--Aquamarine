const express = require('express');
const router = express.Router();
const AdhesionController = require('../controllers/AdhesionController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { uploadAdhesionDocument } = require('../middlewares/upload');

const adhesionController = new AdhesionController();

router.get('/', AuthMiddleware.authenticate, adhesionController.getAll.bind(adhesionController));
router.get('/active', AuthMiddleware.authenticate, adhesionController.getActiveAdhesions.bind(adhesionController));
router.get('/expiring', AuthMiddleware.authenticate, adhesionController.getExpiringAdhesions.bind(adhesionController));
router.get('/stats', adhesionController.getStats.bind(adhesionController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, adhesionController.getByAdherent.bind(adhesionController));
router.get('/adherent/:num_adherent/dossier-status', AuthMiddleware.authenticate, adhesionController.getDossierStatus.bind(adhesionController));
router.get('/adherent/:num_adherent/attestation', AuthMiddleware.authenticate, adhesionController.getAttestation.bind(adhesionController));
router.get('/:id', AuthMiddleware.authenticate, adhesionController.getById.bind(adhesionController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  ...uploadAdhesionDocument,
  adhesionController.validateBeforeCreate.bind(adhesionController),
  adhesionController.create.bind(adhesionController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  ...uploadAdhesionDocument,
  adhesionController.update.bind(adhesionController)
);

router.post('/:id/paiement',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  adhesionController.enregistrerPaiement.bind(adhesionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  adhesionController.delete.bind(adhesionController)
);

module.exports = router;