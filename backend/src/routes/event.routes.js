import express from 'express';
import { validateEvent } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import EventController from '../controllers/event.controller.js';

const createEventRoutes = (socketService) => {
    const router = express.Router();
    const eventController = new EventController(socketService);

    // Public routes (GET only)
    router.get('/range/:start/:end', eventController.getByDateRange);
    router.get('/date/:date', eventController.getByDate);
    router.get('/:id', eventController.get);
    router.get('/', eventController.list);

    // Protected routes require authentication
    router.post('/', authenticate, validateEvent, eventController.create);
    router.put('/:id', authenticate, validateEvent, eventController.update);
    router.delete('/:id', authenticate, eventController.delete);

    // Calendar routes require authentication
    router.post('/import', authenticate, eventController.importICal);
    router.get('/export/:id', authenticate, eventController.exportICal);

    return router;
};

export default createEventRoutes;