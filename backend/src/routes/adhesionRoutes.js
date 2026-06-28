const express = require('express');
const router = express.Router();
const AdhesionController = require('../controllers/AdhesionController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const adhesionController = new AdhesionController();

router.get('/', adhesionController.getAll.bind(adhesionController));
router.get('/active', adhesionController.getActiveAdhesions.bind(adhesionController));
router.get('/expiring', adhesionController.getExpiringAdhesions.bind(adhesionController));
router.get('/stats', adhesionController.getStats.bind(adhesionController));
router.get('/adherent/:num_adherent', adhesionController.getByAdherent.bind(adhesionController));
router.get('/:id', adhesionController.getById.bind(adhesionController));

router.post('/',
  AuthMiddleware.authenticate,
  adhesionController.validateBeforeCreate.bind(adhesionController),
  adhesionController.create.bind(adhesionController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  adhesionController.update.bind(adhesionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  adhesionController.delete.bind(adhesionController)
);

module.exports = router;