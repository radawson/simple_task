const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegistration } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const config = require('../config');
const Logger = require('../core/Logger');

// backend/src/routes/auth.routes.js

const logger = Logger.getInstance();

const logRequest = (req, res, next) => {
    logger.debug(`Auth Request: ${req.method} ${req.path}`, {
        body: req.body,
        headers: {
            contentType: req.headers['content-type'],
            origin: req.headers.origin
        }
    });
    next();
};

// Auth routes
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/register', validateRegistration, authController.register);
router.post('/logout', authenticate, authController.logout);

// SSO routes conditionally enabled
if (config.oidc.enabled) {
    router.get('/sso/login', authController.initiateSSO);
    router.get('/sso/callback', authController.handleSSOCallback); 
    router.get('/sso/logout', authenticate, authController.handleSSOLogout);
}

module.exports = router;