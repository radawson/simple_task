const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Import route modules
const authRoutes = require('./auth.routes');
const fileRoutes = require('./file.routes');
const taskRoutes = require('./task.routes');
const templateRoutes = require('./template.routes');
const eventRoutes = require('./event.routes');
const noteRoutes = require('./note.routes');
const userRoutes = require('./user.routes');
const timecardRoutes = require('./timecard.routes');

// Auth routes (no auth required)
router.use('/auth', authRoutes);

// Protected API routes
router.use('/api', authenticate, (req, res, next) => {
    // Authenticated routes
    router.use('/files', fileRoutes);
    router.use('/tasks', taskRoutes);
    router.use('/templates', templateRoutes);
    router.use('/events', eventRoutes);
    router.use('/notes', noteRoutes);
    router.use('/users', userRoutes);
    router.use('/timecards', timecardRoutes);
    next();
});

module.exports = router;