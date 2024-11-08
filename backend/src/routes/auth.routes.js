const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegistration } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const config = require('../config');

// Local auth routes - ensure controller methods exist
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegistration, authController.register);
router.post('/logout', authenticate, authController.logout);

// SSO routes conditionally enabled
if (config.oidc.enabled) {
    router.get('/sso/login', authController.initiateSSO);
    router.get('/sso/callback', authController.handleSSOCallback);
    router.get('/sso/logout', authenticate, authController.handleSSOLogout);
}

module.exports = router;