const express = require('express');
const router = express.Router();
const PalanqueeController = require('../controllers/PalanqueeController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const palanqueeController = new PalanqueeController();
const STAFF = ROLES.PRESIDENT_MONITEUR;

router.get('/', AuthMiddleware.authenticate, palanqueeController.getAll.bind(palanqueeController));
router.get('/plongee/:id_plongee', AuthMiddleware.authenticate, palanqueeController.getByPlongee.bind(palanqueeController));
router.get('/sortie/:id_sortie/stats', AuthMiddleware.authenticate, palanqueeController.getStatsBySortie.bind(palanqueeController));
router.get('/sortie/:id_sortie', AuthMiddleware.authenticate, palanqueeController.getBySortie.bind(palanqueeController));
router.get('/moniteur/:id_moniteur', AuthMiddleware.authenticate, palanqueeController.getByMoniteur.bind(palanqueeController));
router.get('/:id', AuthMiddleware.authenticate, palanqueeController.getById.bind(palanqueeController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.validateBeforeCreate.bind(palanqueeController),
  palanqueeController.create.bind(palanqueeController)
);

router.post('/:id/membres',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.addMembre.bind(palanqueeController)
);

router.delete('/:id/membres/:num_adherent',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.removeMembre.bind(palanqueeController)
);

router.patch('/:id/encadrement',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.updateEncadrement.bind(palanqueeController)
);

router.post('/:id/plongee',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.enregistrerDonneesPlongee.bind(palanqueeController)
);

router.patch('/:id/retour-materiel',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.retournerMateriel.bind(palanqueeController)
);

router.patch('/:id/cloturer',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.cloturer.bind(palanqueeController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.update.bind(palanqueeController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  palanqueeController.delete.bind(palanqueeController)
);

module.exports = router;
