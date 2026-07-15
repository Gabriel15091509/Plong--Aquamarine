const express = require('express');
const router = express.Router();
const TresorierController = require('../controllers/TresorierController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { ROLES } = require('../utils/roleScope');

const tresorierController = new TresorierController();

router.get('/', tresorierController.getAll.bind(tresorierController));
router.get('/annee/:annee', tresorierController.getByAnnee.bind(tresorierController));
router.get('/user/:user_id', tresorierController.getByUserId.bind(tresorierController));
router.get('/:id', tresorierController.getById.bind(tresorierController));

router.post('/',
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_ONLY),
  tresorierController.validateBeforeCreate.bind(tresorierController),
  tresorierController.create.bind(tresorierController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_ONLY),
  tresorierController.update.bind(tresorierController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_ONLY),
  tresorierController.delete.bind(tresorierController)
);

module.exports = router;
