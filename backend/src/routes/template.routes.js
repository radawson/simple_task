// src/routes/template.routes.js
import { Router } from 'express';
import { validateTemplate } from '../middleware/validation.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import TemplateController from '../controllers/template.controller.js';

const createTemplateRoutes = (socketService) => {
    const router = Router();
    const templateController = new TemplateController(socketService);

    // Basic CRUD operations
    router.get('/', authenticate, templateController.list);
    router.get('/:id', authenticate, templateController.get);
    router.post('/', authenticate, validateTemplate, templateController.create);
    router.patch('/:id', authenticate, validateTemplate, templateController.update);
    router.delete('/:id', authenticate, templateController.delete);

    // Template-specific routes
    router.post('/:id/tasks', authenticate, templateController.addTask);
    router.delete('/:id/tasks/:taskId', authenticate, templateController.removeTask);
    router.post('/:id/generate', authenticate, templateController.generateTasks);

    return router;
};

export default createTemplateRoutes;