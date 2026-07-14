const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/IncidentController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const incidentController = new IncidentController();

router.get('/', incidentController.getAll.bind(incidentController));
router.get('/non-clotures', incidentController.getNonClotures.bind(incidentController));
router.get('/sortie/:id_sortie', incidentController.getBySortie.bind(incidentController));
router.get('/:id', incidentController.getById.bind(incidentController));

router.post('/',
  AuthMiddleware.authenticate,
  authorize(['president', 'moniteur']),
  incidentController.validateBeforeCreate.bind(incidentController),
  incidentController.create.bind(incidentController)
);

router.patch('/:id/cloturer',
  AuthMiddleware.authenticate,
  authorize(['president', 'moniteur']),
  incidentController.cloturer.bind(incidentController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  authorize(['president', 'moniteur']),
  incidentController.update.bind(incidentController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  authorize(['president']),
  incidentController.delete.bind(incidentController)
);

module.exports = router;
