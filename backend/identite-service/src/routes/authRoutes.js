const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const authController = new AuthController();

// Limiteur dédié, plus strict que le limiteur global "/api" (relevé à
// 1000/15min pour l'usage normal de la SPA) : le login/OTP reste la cible
// d'un brute-force, donc on ne veut pas hériter du plafond généreux.
const authLimiter = rateLimit({
  windowMs: (process.env.AUTH_RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX || 20,
  message: {
    success: false,
    message: "Trop de tentatives de connexion, veuillez réessayer plus tard",
  },
  // Hors production : voir gateway-service/src/app.js pour le raisonnement.
  // Le brute-force n'est un risque réel qu'en prod ; en dev, un simple aller-
  // retour login/logout répété pendant des tests atteint vite 20/15min.
  skip: () => process.env.NODE_ENV !== "production",
});

router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/verify-otp', authLimiter, authController.verifyOtp.bind(authController));
router.post('/forgot-password', authLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authLimiter, authController.resetPassword.bind(authController));
router.post('/change-password', AuthMiddleware.authenticate, authController.changePassword.bind(authController));

module.exports = router;
