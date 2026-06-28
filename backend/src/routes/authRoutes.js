const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const authController = new AuthController();

// Routes publiques
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));

// Routes protégées
router.get('/me', AuthMiddleware.authenticate, authController.me.bind(authController));
router.post('/logout', AuthMiddleware.authenticate, authController.logout.bind(authController));

module.exports = router;