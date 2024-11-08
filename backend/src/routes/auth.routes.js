const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegistration } = require('../middleware/validation.middleware');
const config = require('../config');

// Local auth routes always enabled
router.post('/login', authController.login);
router.post('/register', validateRegistration, authController.register);
router.post('/logout', authController.logout);

// SSO routes conditionally enabled
if (config.oidc.enabled) {
    router.get('/sso/login', authController.initiateSSO);
    router.get('/sso/callback', authController.handleSSOCallback);
    router.get('/sso/logout', authController.handleSSOLogout);
}

module.exports = router;