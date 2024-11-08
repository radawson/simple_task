// src/routes/timecard.routes.js
const router = require('express').Router();
const timecardController = require('../controllers/timecard.controller');
const { validateTimecard } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/timecards', authenticate, timecardController.list);
router.get('/timecards/:id', authenticate, timecardController.get);
router.post('/timecards', authenticate, validateTimecard, timecardController.create);
router.put('/timecards/:id', authenticate, validateTimecard, timecardController.update);
router.delete('/timecards/:id', authenticate, authorize(['admin']), timecardController.delete);

// Specialized timecard routes
router.post('/timecards/clock-in', authenticate, timecardController.clockIn);
router.post('/timecards/clock-out', authenticate, timecardController.clockOut);
router.post('/timecards/:id/approve', authenticate, authorize(['admin']), timecardController.approve);
router.get('/timecards/employee/:employeeId', authenticate, timecardController.getByEmployee);
router.get('/timecards/period/:startDate/:endDate', authenticate, timecardController.getByPeriod);

module.exports = router;