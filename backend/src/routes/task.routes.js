// src/routes/task.routes.js
const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { validateTask } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.get('/tasks', authenticate, taskController.list);
router.post('/tasks', authenticate, validateTask, taskController.create);
router.get('/tasks/:id', authenticate, taskController.get);
router.put('/tasks/:id', authenticate, validateTask, taskController.update);
router.delete('/tasks/:id', authenticate, taskController.delete);

module.exports = router;