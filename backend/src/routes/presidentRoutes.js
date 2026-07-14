const express = require('express');
const router = express.Router();
const PresidentController = require('../controllers/PresidentController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const presidentController = new PresidentController();

router.get('/', presidentController.getAll.bind(presidentController));
router.get('/current', presidentController.getCurrent.bind(presidentController));
router.get('/annee/:annee', presidentController.getByAnnee.bind(presidentController));
router.get('/:id', presidentController.getById.bind(presidentController));

router.post('/',
  AuthMiddleware.authenticate,
  authorize(['president']),
  presidentController.validateBeforeCreate.bind(presidentController),
  presidentController.create.bind(presidentController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  authorize(['president']),
  presidentController.update.bind(presidentController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  authorize(['president']),
  presidentController.delete.bind(presidentController)
);

module.exports = router;
