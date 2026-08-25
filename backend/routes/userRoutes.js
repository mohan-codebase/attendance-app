const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerUser, loginUser, googleAuth } = require('../controllers/authController');
const router = express.Router();

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Google sign-in / sign-up (mounted before the auth gate in server.js, so public)
router.post('/google', googleAuth);

module.exports = router;