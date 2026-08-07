const express = require('express');
const router = express.Router();
const AdhesionController = require('../controllers/AdhesionController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { uploadAdhesionDocument, handleAnalysePhotoUpload } = require('../middlewares/upload');
const { ROLES } = require('../utils/roleScope');

const adhesionController = new AdhesionController();

router.get('/', AuthMiddleware.authenticate, adhesionController.getAll.bind(adhesionController));
router.get('/active', AuthMiddleware.authenticate, adhesionController.getActiveAdhesions.bind(adhesionController));
router.get('/expiring', AuthMiddleware.authenticate, adhesionController.getExpiringAdhesions.bind(adhesionController));
router.get('/stats', adhesionController.getStats.bind(adhesionController));
router.get('/taux-renouvellement', adhesionController.getTauxRenouvellement.bind(adhesionController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, adhesionController.getByAdherent.bind(adhesionController));
router.get('/adherent/:num_adherent/dossier-status', AuthMiddleware.authenticate, adhesionController.getDossierStatus.bind(adhesionController));
router.get('/adherent/:num_adherent/attestation', AuthMiddleware.authenticate, adhesionController.getAttestation.bind(adhesionController));
router.get('/:id', AuthMiddleware.authenticate, adhesionController.getById.bind(adhesionController));

router.post('/analyser-photo',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  handleAnalysePhotoUpload,
  adhesionController.analysePhoto.bind(adhesionController)
);

// Le staff (Club + FFESM + assurances) ET l'adhérent (FFESM/assurances
// uniquement, jamais Club — voir AdhesionService.create) peuvent créer une
// entrée : un adhérent qui soumet sa licence FFESM lui-même reste "En
// attente" jusqu'à validation (POST /:id/valider), un staff qui la crée
// est "Validé" d'office. Le rejet de l'adhésion Club pour un adhérent se
// fait service-side, pas ici, pour garder une seule route de création.
router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize([...ROLES.PRESIDENT_TRESORIER, 'adherent']),
  ...uploadAdhesionDocument,
  adhesionController.validateBeforeCreate.bind(adhesionController),
  adhesionController.create.bind(adhesionController)
);

router.post('/:id/valider',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  adhesionController.valider.bind(adhesionController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  ...uploadAdhesionDocument,
  adhesionController.update.bind(adhesionController)
);

router.post('/:id/paiement',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  adhesionController.enregistrerPaiement.bind(adhesionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  adhesionController.delete.bind(adhesionController)
);

module.exports = router;
