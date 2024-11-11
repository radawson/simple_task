// src/routes/timecard.routes.js
import { Router } from 'express';
import { validateTimecard } from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import TimecardController from '../controllers/timecard.controller.js';

const createTimecardRoutes = (socketService) => {
    const router = Router();
    const timecardController = new TimecardController(socketService);

    // Clock in/out routes
    router.post('/clock-in',
        authenticate,
        timecardController.clockIn
    );

    router.post('/clock-out',
        authenticate,
        timecardController.clockOut
    );

    // Employee specific routes
    router.get('/employees/:employeeId/timecards',
        authenticate,
        timecardController.getByEmployee
    );

    // Admin/supervisor routes
    router.post('/:id/approve',
        authenticate,
        authorize(['admin']),
        timecardController.approve
    );

    // Standard CRUD with permission checks
    router.get('/',
        authenticate,
        timecardController.list
    );

    router.post('/',
        authenticate,
        validateTimecard,
        timecardController.create
    );

    router.get('/:id',
        authenticate,
        timecardController.get
    );

    router.put('/:id',
        authenticate,
        validateTimecard,
        timecardController.update
    );

    router.delete('/:id',
        authenticate,
        authorize(['admin']),
        timecardController.delete
    );

    return router;
};

export default createTimecardRoutes;