const express = require('express');
const router = express.Router();
const PaiementController = require('../controllers/PaiementController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const paiementController = new PaiementController();

router.get('/', AuthMiddleware.authenticate, paiementController.getAll.bind(paiementController));
router.get('/pending', AuthMiddleware.authenticate, paiementController.getPendingPayments.bind(paiementController));
router.get('/stats', paiementController.getStats.bind(paiementController)); // ✅ Ajouté
router.get('/total-by-period', AuthMiddleware.authenticate, paiementController.getTotalByPeriod.bind(paiementController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, paiementController.getByAdherent.bind(paiementController));
router.get('/:id/recu', AuthMiddleware.authenticate, paiementController.getRecu.bind(paiementController));
router.get('/:id', AuthMiddleware.authenticate, paiementController.getById.bind(paiementController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  paiementController.validateBeforeCreate.bind(paiementController),
  paiementController.create.bind(paiementController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  paiementController.update.bind(paiementController)
);

router.patch('/:id/process',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  paiementController.processPayment.bind(paiementController)
);

router.patch('/:id/cancel',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  paiementController.cancelPayment.bind(paiementController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "tresorier"]),
  paiementController.delete.bind(paiementController)
);

module.exports = router;