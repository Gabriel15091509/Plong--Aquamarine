const express = require('express');
const router = express.Router();
const AttributionController = require('../controllers/AttributionController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const attributionController = new AttributionController();
const STAFF = ['president', 'moniteur'];

router.get('/', AuthMiddleware.authenticate, attributionController.getAll.bind(attributionController));
router.get('/en-cours', AuthMiddleware.authenticate, attributionController.getEnCours.bind(attributionController));
router.get('/adherent/:num_adherent', AuthMiddleware.authenticate, attributionController.getByAdherent.bind(attributionController));
router.get('/materiel/:num_inventaire', AuthMiddleware.authenticate, attributionController.getByMateriel.bind(attributionController));
router.get('/palanquee/:id_palanquee', AuthMiddleware.authenticate, attributionController.getByPalanquee.bind(attributionController));
router.get('/:id', AuthMiddleware.authenticate, attributionController.getById.bind(attributionController));

router.post('/',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(STAFF),
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
  AuthMiddleware.authorize(['president']),
  attributionController.delete.bind(attributionController)
);

module.exports = router;
