const express = require('express');
const router = express.Router();
const PaiementController = require('../controllers/PaiementController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const paiementController = new PaiementController();

router.get('/', paiementController.getAll.bind(paiementController));
router.get('/pending', paiementController.getPendingPayments.bind(paiementController));
router.get('/stats', paiementController.getStats.bind(paiementController)); // ✅ Ajouté
router.get('/total-by-period', paiementController.getTotalByPeriod.bind(paiementController));
router.get('/adherent/:num_adherent', paiementController.getByAdherent.bind(paiementController));
router.get('/:id', paiementController.getById.bind(paiementController));

router.post('/',
  AuthMiddleware.authenticate,
  paiementController.validateBeforeCreate.bind(paiementController),
  paiementController.create.bind(paiementController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  paiementController.update.bind(paiementController)
);

router.patch('/:id/process',
  AuthMiddleware.authenticate,
  paiementController.processPayment.bind(paiementController)
);

router.patch('/:id/cancel',
  AuthMiddleware.authenticate,
  paiementController.cancelPayment.bind(paiementController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  paiementController.delete.bind(paiementController)
);

module.exports = router;