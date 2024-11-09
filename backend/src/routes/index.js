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

// Public routes
router.use('/auth', authRoutes);

// Protected routes with auth middleware
router.use(authenticate);
router.use('/api/files', fileRoutes);
router.use('/api/tasks', taskRoutes);
router.use('/api/templates', templateRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/notes', noteRoutes);
router.use('/api/users', userRoutes);
router.use('/api/timecards', timecardRoutes);

module.exports = router;