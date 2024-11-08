// src/routes/note.routes.js
const router = require('express').Router();
const noteController = require('../controllers/note.controller');
const { validateNote } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

router.get('/notes', authenticate, noteController.list);
router.get('/notes/:id', authenticate, noteController.get);
router.post('/notes', authenticate, validateNote, noteController.create);
router.put('/notes/:id', authenticate, validateNote, noteController.update);
router.delete('/notes/:id', authenticate, noteController.delete);

// Additional note routes
router.get('/notes/date/:date', authenticate, noteController.getByDate);
router.get('/notes/search', authenticate, noteController.search);

module.exports = router;