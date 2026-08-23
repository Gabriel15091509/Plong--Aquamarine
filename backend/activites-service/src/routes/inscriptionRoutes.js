const express = require('express');
const router = express.Router();
const InscriptionController = require('../controllers/InscriptionController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const inscriptionController = new InscriptionController();

router.get('/', AuthMiddleware.authenticate, inscriptionController.getAll.bind(inscriptionController));
router.get('/stats', AuthMiddleware.authenticate, inscriptionController.getStats.bind(inscriptionController));
router.get('/sortie/:id_sortie', AuthMiddleware.authenticate, inscriptionController.getBySortie.bind(inscriptionController));
router.get('/sortie/:id_sortie/waitlist', AuthMiddleware.authenticate, inscriptionController.getWaitlist.bind(inscriptionController));
router.get('/sortie/:id_sortie/capacity', AuthMiddleware.authenticate, inscriptionController.getCapacity.bind(inscriptionController));
router.get('/adherent/:num_adherent/sortie/:id_sortie', AuthMiddleware.authenticate, inscriptionController.getByAdherentAndSortie.bind(inscriptionController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, inscriptionController.getByAdherent.bind(inscriptionController));
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

// PRESIDENT_TRESORIER, pas STAFF : enregistrer un paiement est une action
// financière réservée à président/trésorier partout ailleurs (permission
// manage_paiements, absente du rôle moniteur côté
// AuthController.getPermissionsForRole ; voir aussi le bouton "Enregistrer
// un paiement", masqué au moniteur dans InscriptionDetails.jsx).
router.post('/:id/paiement',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  inscriptionController.enregistrerPaiement.bind(inscriptionController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  inscriptionController.update.bind(inscriptionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  inscriptionController.delete.bind(inscriptionController)
);

// Suppression groupée — même garde que la suppression unitaire ci-dessus.
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  inscriptionController.bulkDelete.bind(inscriptionController)
);

module.exports = router;
