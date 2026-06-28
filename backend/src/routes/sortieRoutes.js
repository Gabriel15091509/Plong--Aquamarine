const express = require('express');
const router = express.Router();
const SortieController = require('../controllers/SortieController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const sortieController = new SortieController();

router.get('/', sortieController.getAll.bind(sortieController));
router.get('/upcoming', sortieController.getUpcomingSorties.bind(sortieController));
router.get('/with-inscriptions', sortieController.getSortiesWithInscriptions.bind(sortieController));
router.get('/available-places', sortieController.getAvailablePlaces.bind(sortieController));
router.get('/stats', sortieController.getStats.bind(sortieController)); // ✅ Ajouté
router.get('/:id', sortieController.getById.bind(sortieController));
router.get('/:id/details', sortieController.getSortieDetails.bind(sortieController));

router.post('/',
  AuthMiddleware.authenticate,
  sortieController.validateBeforeCreate.bind(sortieController),
  sortieController.create.bind(sortieController)
);

router.put('/:id',
  AuthMiddleware.authenticate,
  sortieController.update.bind(sortieController)
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  sortieController.delete.bind(sortieController)
);

module.exports = router;