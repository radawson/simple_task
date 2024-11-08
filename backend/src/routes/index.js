const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const fileRoutes = require('./file.routes');
const taskRoutes = require('./task.routes');
const templateRoutes = require('./template.routes');
const eventRoutes = require('./event.routes');
const noteRoutes = require('./note.routes');
const userRoutes = require('./user.routes');
const timecardRoutes = require('./timecard.routes');

// Auth/SSO routes
router.use('/auth', authRoutes);

// API routes with authentication
const authenticate = require('../middleware/auth.middleware');
router.use('/api', authenticate, [
    fileRoutes,
    taskRoutes,
    templateRoutes,
    eventRoutes,
    noteRoutes,
    userRoutes,
    timecardRoutes
]);

// Health check (no auth required)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

module.exports = router;
