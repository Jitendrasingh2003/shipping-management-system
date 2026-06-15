const express = require('express');
const router = express.Router();
const { login, register, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validators');

// Public — rate-limited + validated
router.post('/login',    authLimiter, validateLogin,    login);
router.post('/register', authLimiter, validateRegister, register);

// Protected
router.get('/me',                    protect, getMe);
router.put('/profile',               protect, updateProfile);
router.put('/change-password',       protect, validateChangePassword, changePassword);

module.exports = router;
