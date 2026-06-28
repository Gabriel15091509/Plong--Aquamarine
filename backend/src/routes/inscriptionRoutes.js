const express = require('express');
const router = express.Router();
const InscriptionController = require('../controllers/InscriptionController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const inscriptionController = new InscriptionController();

router.get('/', inscriptionController.getAll.bind(inscriptionController));
router.get('/stats', inscriptionController.getStats.bind(inscriptionController));
router.get('/sortie/:id_sortie', inscriptionController.getBySortie.bind(inscriptionController));
router.get('/sortie/:id_sortie/waitlist', inscriptionController.getWaitlist.bind(inscriptionController));
router.get('/adherent/:num_adherent/sortie/:id_sortie', inscriptionController.getByAdherentAndSortie.bind(inscriptionController));
router.get('/:id', inscriptionController.getById.bind(inscriptionController));

router.post('/',
  AuthMiddleware.authenticate,
  inscriptionController.validateBeforeCreate.bind(inscriptionController),
  inscriptionController.createInscription.bind(inscriptionController)
);

router.patch('/:id/confirm',
  AuthMiddleware.authenticate,
  inscriptionController.confirmInscription.bind(inscriptionController)
);

router.patch('/:id/cancel',
  AuthMiddleware.authenticate,
  inscriptionController.cancelInscription.bind(inscriptionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  inscriptionController.delete.bind(inscriptionController)
);

module.exports = router;