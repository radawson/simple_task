// src/routes/task.routes.js
import { Router } from 'express';
import { validateTask } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import TaskController from '../controllers/task.controller.js';

const createTaskRoutes = (socketService) => {
    const router = Router();
    const taskController = new TaskController(socketService);

    // Public routes (GET only)
    router.get('/date/:date', taskController.getByDate);
    router.get('/:id', taskController.get);
    router.get('/', taskController.list);

    // Protected routes require authentication
    router.post('/', authenticate, validateTask, taskController.create);
    router.patch('/:id', authenticate, taskController.update);
    router.delete('/:id', authenticate, taskController.delete);

    return router;
};

export default createTaskRoutes;