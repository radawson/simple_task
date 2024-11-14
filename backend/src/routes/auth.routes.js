// src/routes/auth.routes.js
import { Router } from 'express';
import { validateLogin, validateRegistration } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import AuthController from '../controllers/auth.controller.js';
import config from '../config/index.js';
import Logger from '../core/Logger.js';

const createAuthRoutes = (socketService) => {
    const router = Router();
    const logger = Logger.getInstance();
    const authController = new AuthController(socketService);

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
    router.post('/login', logRequest, validateLogin, authController.login);
    router.post('/refresh', logRequest, authController.refreshToken);
    router.post('/register', logRequest, validateRegistration, authController.register);
    router.post('/logout', logRequest, authenticate, authController.logout);

    // SSO routes conditionally enabled
    if (config.oidc.enabled) {
        router.get('/sso/login', authController.initiateSSO);
        router.get('/sso/callback', authController.handleSSOCallback);
        router.get('/sso/logout', authenticate, authController.handleSSOLogout);
    }

    return router;
};

export default createAuthRoutes;