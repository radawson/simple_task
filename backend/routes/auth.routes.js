const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const generateScramKeys = require('../middleware/scram.middleware');

/**
 * POST /api/auth/login
 * Purpose: login a user
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * Purpose: logout a user
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/register
 * Purpose: create a new user
 */
router.post('/register', generateScramKeys(), authController.register);

module.exports = router;