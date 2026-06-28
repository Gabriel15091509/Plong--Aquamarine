const express = require('express');
const router = express.Router();
const AdherentController = require('../controllers/AdherentController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const adherentController = new AdherentController();

// Routes publiques
router.get('/', adherentController.getAll.bind(adherentController));
router.get('/active', adherentController.getActiveAdherents.bind(adherentController));
router.get('/expiring-certificates', adherentController.getWithExpiringCertificates.bind(adherentController));
router.get('/search', adherentController.search.bind(adherentController));
router.get('/stats', adherentController.getStats.bind(adherentController)); // ✅ Ajouté
router.get('/email/:email', adherentController.getByEmail.bind(adherentController));
router.get('/niveau/:niveau', adherentController.getByNiveau.bind(adherentController));
router.get('/:id', adherentController.getById.bind(adherentController));
router.get('/:id/details', adherentController.getWithDetails.bind(adherentController));

// Routes protégées
router.post('/',
  AuthMiddleware.authenticate,
  adherentController.validateBeforeCreate.bind(adherentController),
  adherentController.create.bind(adherentController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  adherentController.validateBeforeUpdate.bind(adherentController),
  adherentController.update.bind(adherentController)
);

router.patch('/:id/increment-plongees',
  AuthMiddleware.authenticate,
  adherentController.incrementPlongees.bind(adherentController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  adherentController.delete.bind(adherentController)
);

module.exports = router;