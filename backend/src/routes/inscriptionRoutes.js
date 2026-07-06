const express = require('express');
const router = express.Router();
const InscriptionController = require('../controllers/InscriptionController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const inscriptionController = new InscriptionController();

router.get('/', AuthMiddleware.authenticate, inscriptionController.getAll.bind(inscriptionController));
router.get('/stats', AuthMiddleware.authenticate, inscriptionController.getStats.bind(inscriptionController));
router.get('/sortie/:id_sortie', AuthMiddleware.authenticate, inscriptionController.getBySortie.bind(inscriptionController));
router.get('/sortie/:id_sortie/waitlist', AuthMiddleware.authenticate, inscriptionController.getWaitlist.bind(inscriptionController));
router.get('/sortie/:id_sortie/capacity', AuthMiddleware.authenticate, inscriptionController.getCapacity.bind(inscriptionController));
router.get('/adherent/:num_adherent/sortie/:id_sortie', AuthMiddleware.authenticate, inscriptionController.getByAdherentAndSortie.bind(inscriptionController));
router.get('/:id', AuthMiddleware.authenticate, inscriptionController.getById.bind(inscriptionController));

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

router.put('/:id',
  AuthMiddleware.authenticate,
  inscriptionController.update.bind(inscriptionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  inscriptionController.delete.bind(inscriptionController)
);

module.exports = router;
