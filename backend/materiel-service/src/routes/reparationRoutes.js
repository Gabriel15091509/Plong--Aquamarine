const express = require('express');
const router = express.Router();
const ReparationController = require('../controllers/ReparationController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const reparationController = new ReparationController();

router.get('/', reparationController.getAll.bind(reparationController));
router.get('/en-cours', reparationController.getEnCours.bind(reparationController));
router.get('/materiel/:num_inventaire', reparationController.getByMateriel.bind(reparationController));
router.get('/:id', reparationController.getById.bind(reparationController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  reparationController.validateBeforeCreate.bind(reparationController),
  reparationController.create.bind(reparationController)
);

router.patch('/:id/terminer',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  reparationController.terminer.bind(reparationController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  reparationController.update.bind(reparationController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  reparationController.delete.bind(reparationController)
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  reparationController.bulkDelete.bind(reparationController)
);

module.exports = router;
