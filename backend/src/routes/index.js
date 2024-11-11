import express from 'express';
import { authenticate } from '../middleware/auth.middleware';


const createRouter = (socketService) => {
    const router = express.Router();

    // Import route modules with socket service injection
    const createAuthRoutes = require('./auth.routes');
    const createFileRoutes = require('./file.routes');
    const createTaskRoutes = require('./task.routes');
    const createTemplateRoutes = require('./template.routes');
    const createEventRoutes = require('./event.routes');
    const createNoteRoutes = require('./note.routes');
    const createUserRoutes = require('./user.routes');
    const createTimecardRoutes = require('./timecard.routes');

    // Initialize routes with socket service
    const authRoutes = createAuthRoutes(socketService);
    const fileRoutes = createFileRoutes(socketService);
    const taskRoutes = createTaskRoutes(socketService);
    const templateRoutes = createTemplateRoutes(socketService);
    const eventRoutes = createEventRoutes(socketService);
    const noteRoutes = createNoteRoutes(socketService);
    const userRoutes = createUserRoutes(socketService);
    const timecardRoutes = createTimecardRoutes(socketService);

    // Public routes
    router.use('/auth', authRoutes);
    router.use('/api/tasks', taskRoutes);
    router.use('/api/events', eventRoutes);
    router.use('/api/notes', noteRoutes);

    // Protected routes
    router.use('/api/files', authenticate, fileRoutes);
    router.use('/api/templates', authenticate, templateRoutes);
    router.use('/api/users', authenticate, userRoutes);
    router.use('/api/timecards', authenticate, timecardRoutes);

    return router;
};

export default createRouter;