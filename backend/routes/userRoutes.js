const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  registerUser,
  loginUser,
  googleAuth,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const {
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordLimiter,
} = require('../middleware/rateLimit');
const router = express.Router();

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Google sign-in / sign-up (mounted before the auth gate in server.js, so public)
router.post('/google', googleAuth);

// Password reset. Public by definition — the caller cannot log in, so both are
// rate limited: by address, and by the account being asked about.
router.post(
  '/forgot-password',
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  forgotPassword
);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

module.exports = router;