const express = require('express');
const router = express.Router();
const CompetenceController = require('../controllers/CompetenceController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const competenceController = new CompetenceController();

router.get('/', competenceController.getAll.bind(competenceController));
router.get('/formation/:id_formation', competenceController.getByFormation.bind(competenceController));
router.get('/:id', competenceController.getById.bind(competenceController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  competenceController.validateBeforeCreate.bind(competenceController),
  competenceController.create.bind(competenceController)
);

router.patch('/:id/valider',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  competenceController.valider.bind(competenceController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  competenceController.update.bind(competenceController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  competenceController.delete.bind(competenceController)
);

module.exports = router;
