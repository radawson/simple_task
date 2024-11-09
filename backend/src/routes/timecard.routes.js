const router = require('express').Router();
const timecardController = require('../controllers/timecard.controller');
const { validateTimecard } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Clock in/out routes
router.post('/clock-in',
    authenticate,
    timecardController.clockIn
);

router.post('/clock-out',
    authenticate,
    timecardController.clockOut
);

// Admin/supervisor routes
router.post('/timecards/:id/approve',
    authenticate,
    authorize(['admin']), 
    timecardController.approve
);

// Standard CRUD with permission checks
router.get('/timecards',
    authenticate,
    timecardController.list
);

router.post('/timecards',
    authenticate,
    validateTimecard,
    timecardController.create
);

router.get('/timecards/:id',
    authenticate,
    timecardController.get
);

router.put('/timecards/:id',
    authenticate,
    validateTimecard,
    timecardController.update
);

router.delete('/timecards/:id',
    authenticate,
    authorize(['admin']),
    timecardController.delete
);

// Employee specific routes
router.get('/employees/:employeeId/timecards',
    authenticate,
    timecardController.getByEmployee
);

module.exports = router;