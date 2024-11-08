const express = require('express');
const router = express.Router();

// Import individual route modules
const authRoutes = require('./auth.routes');
const fileRoutes = require('./file.routes');
const taskRoutes = require('./task.routes');
const userRoutes = require('./user.routes');
  
// Register authorization routes with the router
router.use('/auth', authRoutes);

// Register file handling routes
router.use('/files', fileRoutes);

// Register task routes with the router
router.use('/tasks', taskRoutes);

// Register user routes with the router
router.use('/users', userRoutes);

//health check
router.get('/check', (req, res) => {
    res.status(200).json({ message: 'ready.' });
});

module.exports = router;
