const express = require('express');
const router = express.Router();
const PaiementController = require('../controllers/PaiementController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const paiementController = new PaiementController();

router.get('/', AuthMiddleware.authenticate, paiementController.getAll.bind(paiementController));
router.get('/pending', AuthMiddleware.authenticate, paiementController.getPendingPayments.bind(paiementController));
router.get('/stats', paiementController.getStats.bind(paiementController));
router.get('/trend', paiementController.getTrend.bind(paiementController));
router.get('/total-by-period', AuthMiddleware.authenticate, paiementController.getTotalByPeriod.bind(paiementController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, paiementController.getByAdherent.bind(paiementController));
router.get('/:id/recu', AuthMiddleware.authenticate, paiementController.getRecu.bind(paiementController));
router.get('/:id', AuthMiddleware.authenticate, paiementController.getById.bind(paiementController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.validateBeforeCreate.bind(paiementController),
  paiementController.create.bind(paiementController)
);

// Route interne inter-services (pas exposée au frontend) : utilisée par les
// services propriétaires d'un objet payant (formation-service,
// materiel-service, le monolithe pour Adhesion/Sortie/Caution) pour
// enregistrer leur ligne Paiement liée — voir PaiementController.createLinked.
router.post('/linked',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.createLinked.bind(paiementController)
);

// Route interne inter-services : utilisée par le monolithe
// (AttributionService.restituerCaution) via paiementClient.marquerRembourse.
router.patch('/marquer-rembourse',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.marquerRembourse.bind(paiementController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.update.bind(paiementController)
);

router.patch('/:id/process',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.processPayment.bind(paiementController)
);

router.patch('/:id/cancel',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.cancelPayment.bind(paiementController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  paiementController.delete.bind(paiementController)
);

module.exports = router;
