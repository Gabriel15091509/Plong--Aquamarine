const express = require('express');
const router = express.Router();
const MoniteurController = require('../controllers/MoniteurController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const moniteurController = new MoniteurController();

router.get('/', moniteurController.getAll.bind(moniteurController));
router.get('/disponibles', moniteurController.getDisponibles.bind(moniteurController));
router.get('/specialite/:specialite', moniteurController.getBySpecialite.bind(moniteurController));
router.get('/user/:user_id', moniteurController.getByUserId.bind(moniteurController));
router.get('/:id', moniteurController.getById.bind(moniteurController));

router.post('/',
  AuthMiddleware.authenticate,
  authorize(['president']),
  moniteurController.validateBeforeCreate.bind(moniteurController),
  moniteurController.create.bind(moniteurController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  authorize(['president']),
  moniteurController.update.bind(moniteurController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  authorize(['president']),
  moniteurController.delete.bind(moniteurController)
);

module.exports = router;
