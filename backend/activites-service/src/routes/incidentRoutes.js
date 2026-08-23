const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/IncidentController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const incidentController = new IncidentController();

router.get('/', incidentController.getAll.bind(incidentController));
router.get('/non-clotures', incidentController.getNonClotures.bind(incidentController));
router.get('/sortie/:id_sortie', incidentController.getBySortie.bind(incidentController));
router.get('/:id', incidentController.getById.bind(incidentController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  incidentController.validateBeforeCreate.bind(incidentController),
  incidentController.create.bind(incidentController)
);

router.patch('/:id/cloturer',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  incidentController.cloturer.bind(incidentController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  incidentController.update.bind(incidentController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  incidentController.delete.bind(incidentController)
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  incidentController.bulkDelete.bind(incidentController)
);

module.exports = router;
