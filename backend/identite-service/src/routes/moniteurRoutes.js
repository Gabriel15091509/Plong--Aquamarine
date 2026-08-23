const express = require('express');
const router = express.Router();
const MoniteurController = require('../controllers/MoniteurController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const moniteurController = new MoniteurController();

router.get('/', moniteurController.getAll.bind(moniteurController));
router.get('/disponibles', moniteurController.getDisponibles.bind(moniteurController));
router.get('/specialite/:specialite', moniteurController.getBySpecialite.bind(moniteurController));
router.get('/user/:user_id', moniteurController.getByUserId.bind(moniteurController));
router.get('/:id', moniteurController.getById.bind(moniteurController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  moniteurController.validateBeforeCreate.bind(moniteurController),
  moniteurController.create.bind(moniteurController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  moniteurController.update.bind(moniteurController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  moniteurController.delete.bind(moniteurController)
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  moniteurController.bulkDelete.bind(moniteurController)
);

module.exports = router;
