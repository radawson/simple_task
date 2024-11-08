const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { validateUser, validatePassword } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

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

router.get('/users/:id', 
    authenticate, 
    authorize(['admin']), 
    userController.get
);

router.put('/users/:id', 
    authenticate, 
    authorize(['admin']), 
    validateUser, 
    userController.update
);

router.delete('/users/:id', 
    authenticate, 
    authorize(['admin']), 
    userController.delete
);

// User profile routes
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
    validatePassword, 
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

// User preferences
router.get('/preferences', 
    authenticate, 
    userController.getPreferences
);

router.put('/preferences', 
    authenticate, 
    userController.updatePreferences
);

// Employee management
router.get('/employees', 
    authenticate, 
    authorize(['admin', 'manager']), 
    userController.listEmployees
);

router.put('/users/:id/activate', 
    authenticate, 
    authorize(['admin']), 
    userController.activateUser
);

router.put('/users/:id/deactivate', 
    authenticate, 
    authorize(['admin']), 
    userController.deactivateUser
);

module.exports = router;