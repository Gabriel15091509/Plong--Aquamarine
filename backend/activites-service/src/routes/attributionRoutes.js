const express = require('express');
const router = express.Router();
const AttributionController = require('../controllers/AttributionController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const { ROLES } = require('../utils/roleScope');

const attributionController = new AttributionController();
const STAFF = ROLES.PRESIDENT_MONITEUR;

router.get('/', AuthMiddleware.authenticate, attributionController.getAll.bind(attributionController));
router.get('/en-cours', AuthMiddleware.authenticate, attributionController.getEnCours.bind(attributionController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, attributionController.getByAdherent.bind(attributionController));
router.get('/materiel/:num_inventaire', AuthMiddleware.authenticate, attributionController.getByMateriel.bind(attributionController));
router.get('/sortie/:id_sortie', AuthMiddleware.authenticate, attributionController.getBySortie.bind(attributionController));
router.get('/palanquee/:id_palanquee', AuthMiddleware.authenticate, attributionController.getByPalanquee.bind(attributionController));
router.get('/:id', AuthMiddleware.authenticate, attributionController.getById.bind(attributionController));

// PRESIDENT_ONLY, pas STAFF : attribuer du matériel (nouveau checkout) est
// une décision de gestion d'inventaire réservée au président partout
// ailleurs (canSeeMateriel dans Sidebar.jsx côté frontend, routes
// /attributions/create restreintes à ["president"] dans App.jsx). Avant ce
// correctif, un moniteur ou un trésorier pouvait créer une attribution
// directement via cette route même sans qu'aucun lien visible n'y mène
// dans l'appli normale (le seul chemin découvert menait via la mini-form
// "Attribuer" de PalanqueeCard.jsx, désormais elle aussi masquée pour eux).
router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  attributionController.validateBeforeCreate.bind(attributionController),
  attributionController.create.bind(attributionController)
);

router.patch('/:id/retour',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  attributionController.retourner.bind(attributionController)
);

router.post('/:id/caution',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  attributionController.enregistrerCaution.bind(attributionController)
);

router.post('/:id/restituer-caution',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  attributionController.restituerCaution.bind(attributionController)
);

router.post('/:id/deterioration',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  attributionController.traiterDeterioration.bind(attributionController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
  attributionController.update.bind(attributionController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  attributionController.delete.bind(attributionController)
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post('/bulk-delete',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  attributionController.bulkDelete.bind(attributionController)
);

module.exports = router;
