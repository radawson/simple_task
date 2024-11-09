const router = require('express').Router();
const noteController = require('../controllers/note.controller');
const { validateNote } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/notes', authenticate, noteController.list);
router.post('/notes', authenticate, validateNote, noteController.create);
router.get('/notes/:id', authenticate, noteController.get);
router.put('/notes/:id', authenticate, validateNote, noteController.update);
router.delete('/notes/:id', authenticate, noteController.delete);

router.get('/notes/date/:date', authenticate, noteController.getByDate);
router.get('/notes/search', authenticate, noteController.search);

module.exports = router;