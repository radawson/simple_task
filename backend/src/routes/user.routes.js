import { Router } from 'express';
import { 
    validateUser, 
    validatePassword,
    validateUpdatePassword 
} from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import UserController from '../controllers/user.controller.js';

const createUserRoutes = (socketService) => {
    const router = Router();
    const userController = new UserController(socketService);

    // Admin routes
    router.get('/', 
        authenticate, 
        authorize(['admin']), 
        userController.list
    );

    router.post('/', 
        authenticate, 
        authorize(['admin']), 
        validateUser, 
        userController.create
    );

    // Profile routes
    router.get('/profile', 
        authenticate, 
        userController.getProfile
    );

    router.put('/profile', 
        authenticate, 
        validateUser, 
        userController.updateProfile
    );

    router.put('/profile/password', 
        authenticate, 
        validateUpdatePassword, 
        userController.updatePassword
    );

    // Password reset flow
    router.post('/password/reset-request', 
        userController.requestPasswordReset
    );

    router.post('/password/reset/:token', 
        validatePassword, 
        userController.resetPassword
    );

    // SSO specific routes
    router.post('/sso', 
        authenticate, 
        authorize(['admin']), 
        validateUser, 
        userController.createSSOUser
    );

    router.put('/sso/:id/sync', 
        authenticate, 
        authorize(['admin']), 
        userController.syncSSOUser
    );

    return router;
};

export default createUserRoutes;