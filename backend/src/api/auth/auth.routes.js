const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { requireAuth, requirePreSession } = require('../../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de inicio de sesión, intente más tarde',
  },
});

router.post('/login', loginLimiter, authController.login);
router.post('/select-company', requirePreSession, authController.selectCompany);
router.get('/me', requireAuth, authController.me);

module.exports = router;
