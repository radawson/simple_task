// src/routes/event.routes.js
const router = require('express').Router();
const eventController = require('../controllers/event.controller');
const { validateEvent } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.get('/events', authenticate, eventController.list);
router.get('/events/:id', authenticate, eventController.get);
router.post('/events', authenticate, validateEvent, eventController.create);
router.put('/events/:id', authenticate, validateEvent, eventController.update);
router.delete('/events/:id', authenticate, eventController.delete);

// Calendar specific routes
router.post('/events/import', authenticate, eventController.importICal);
router.get('/events/export/:id', authenticate, eventController.exportICal);
router.get('/events/date/:date', authenticate, eventController.getByDate);
router.get('/events/range/:start/:end', authenticate, eventController.getByDateRange);

module.exports = router;