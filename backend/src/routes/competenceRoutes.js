const express = require('express');
const router = express.Router();
const CompetenceController = require('../controllers/CompetenceController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const competenceController = new CompetenceController();

router.get('/', competenceController.getAll.bind(competenceController));
router.get('/formation/:id_formation', competenceController.getByFormation.bind(competenceController));
router.get('/:id', competenceController.getById.bind(competenceController));

router.post('/',
  AuthMiddleware.authenticate,
  authorize(["president", "moniteur"]),
  competenceController.validateBeforeCreate.bind(competenceController),
  competenceController.create.bind(competenceController)
);

router.patch('/:id/valider',
  AuthMiddleware.authenticate,
  authorize(["president", "moniteur"]),
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
