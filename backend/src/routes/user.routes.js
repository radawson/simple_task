const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { 
    validateUser, 
    validatePassword,
    validateUpdatePassword  
} = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin routes
router.get('/users', 
    authenticate, 
    authorize(['admin']), 
    userController.list
);

router.post('/users', 
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
router.post('/users/sso', 
    authenticate, 
    authorize(['admin']), 
    validateUser, 
    userController.createSSOUser
);

router.put('/users/sso/:id/sync', 
    authenticate, 
    authorize(['admin']), 
    userController.syncSSOUser
);

module.exports = router;