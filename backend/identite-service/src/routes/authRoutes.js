const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const authController = new AuthController();
const { bootstrapCsrf, clearSession } = require('../../../shared/browserSession');
const { requireInternal } = require('../../../shared/serviceAuth');
const SessionService = require('../services/SessionService');
const jwt = require('jsonwebtoken');

router.post('/introspect', requireInternal, async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    let decoded;
    try { decoded = jwt.verify(req.body.token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return res.json({ active: false }); }
    return res.json({ active: await SessionService.validate(decoded, req.body.token) });
  } catch (error) { next(error); }
});

router.get('/csrf', bootstrapCsrf);
router.get('/session', AuthMiddleware.authenticate, (req, res, next) => {
  Promise.resolve(authController.session(req, res)).catch(next);
});
router.post('/logout', async (req, res, next) => {
  try {
    const { readCookie, SESSION_COOKIE } = require('../../../shared/browserSession');
    const token = readCookie(req, SESSION_COOKIE) || req.headers.authorization?.split(' ')[1];
    await SessionService.revoke(token);
    return clearSession(req, res);
  } catch (error) { next(error); }
});

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
