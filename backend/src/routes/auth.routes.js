const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegistration } = require('../middleware/validation');

// Local auth
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegistration, authController.register);
router.post('/logout', authController.logout);

// OIDC/Keycloak routes
router.get('/sso', authController.initiateSSO);
router.get('/sso/callback', authController.handleSSOCallback);
router.get('/sso/logout', authController.handleSSOLogout);

// Token validation
router.post('/verify', authController.verifyToken);
router.post('/refresh', authController.refreshToken);

module.exports = router;