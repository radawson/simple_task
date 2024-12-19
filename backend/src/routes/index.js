//src/routes/index.js
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

// Import route creators
import createAuthRoutes from './auth.routes.js';
import createFileRoutes from './file.routes.js';
import createEventRoutes from './event.routes.js';
import createNoteRoutes from './note.routes.js';
import createPersonRoutes from './person.routes.js';
import createTaskRoutes from './task.routes.js';
import createTemplateRoutes from './template.routes.js';
import createTimecardRoutes from './timecard.routes.js';
import createUserRoutes from './user.routes.js';

const createRouter = (socketService) => {
    const router = express.Router();

    // Initialize routes with socket service
    const authRoutes = createAuthRoutes(socketService);
    const fileRoutes = createFileRoutes(socketService);
    const eventRoutes = createEventRoutes(socketService);
    const noteRoutes = createNoteRoutes(socketService);
    const personRoutes = createPersonRoutes(socketService);
    const taskRoutes = createTaskRoutes(socketService);
    const templateRoutes = createTemplateRoutes(socketService);
    const timecardRoutes = createTimecardRoutes(socketService);
    const userRoutes = createUserRoutes(socketService);

    // Public routes (dashboard accessible)
    router.use('/auth', authRoutes);
    router.use('/api/tasks', taskRoutes);      // Public GET routes
    router.use('/api/events', eventRoutes);    // Public GET routes
    router.use('/api/notes', noteRoutes);      // Public GET routes

    // Protected routes (require authentication)
    router.use('/api/files', authenticate, fileRoutes);
    router.use('/api/persons', authenticate, personRoutes);
    router.use('/api/templates', authenticate, templateRoutes);
    router.use('/api/users', authenticate, userRoutes);
    router.use('/api/timecards', authenticate, timecardRoutes);

    return router;
};

export default createRouter;