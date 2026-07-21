const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middlewares/authMiddleware');

const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/verify-otp', authController.verifyOtp.bind(authController));
router.post('/change-password', AuthMiddleware.authenticate, authController.changePassword.bind(authController));

module.exports = router;
