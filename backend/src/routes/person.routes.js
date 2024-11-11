// src/routes/person.routes.js
import { Router } from 'express';
import { validatePerson } from '../middleware/validation.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import PersonController from '../controllers/person.controller';

const createPersonRoutes = (socketService) => {
    const router = Router();
    const personController = new PersonController(socketService);

    // Specialized endpoints (order matters - put specific routes before parameterized ones)
    router.get('/search', authenticate, personController.search);
    router.post('/bulk', authenticate, authorize(['admin']), personController.bulkCreate);
    router.put('/bulk', authenticate, authorize(['admin']), personController.bulkUpdate);

    // Basic CRUD with admin/manager authorization
    router.get('/', authenticate, personController.list);
    router.post('/', 
        authenticate, 
        authorize(['admin', 'manager']),
        validatePerson, 
        personController.create
    );

    // Routes with :id parameter
    router.get('/:id', authenticate, personController.get);
    router.put('/:id',
        authenticate,
        authorize(['admin', 'manager']),
        validatePerson,
        personController.update
    );
    router.delete('/:id',
        authenticate,
        authorize(['admin']),
        personController.delete
    );

    // Schedule-related endpoints
    router.get('/:id/schedule', authenticate, personController.getSchedule);
    router.get('/:id/events', authenticate, personController.getEvents);
    router.get('/:id/availability', authenticate, personController.getAvailability);

    return router;
};

export default createPersonRoutes;