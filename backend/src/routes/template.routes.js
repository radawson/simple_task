// src/routes/template.routes.js
const router = require('express').Router();
const templateController = require('../controllers/template.controller');
const { validateTemplate } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/templates', authenticate, templateController.list);
router.get('/templates/:id', authenticate, templateController.get);
router.post('/templates', authenticate, validateTemplate, templateController.create);
router.put('/templates/:id', authenticate, validateTemplate, templateController.update);
router.delete('/templates/:id', authenticate, templateController.delete);

// Template-specific routes
router.post('/templates/:id/tasks', authenticate, templateController.addTask);
router.delete('/templates/:id/tasks/:taskId', authenticate, templateController.removeTask);
router.post('/templates/:id/generate', authenticate, templateController.generateTasks);

module.exports = router;