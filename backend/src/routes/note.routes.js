// src/routes/note.routes.js
import { Router } from 'express';
import { validateNote } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import NoteController from '../controllers/note.controller';

const createNoteRoutes = (socketService) => {
    const router = Router();
    const noteController = new NoteController(socketService);

    // Public routes (GET only)
    router.get('/date/:date', noteController.getByDate);
    router.get('/search', noteController.search);
    router.get('/:id', noteController.get);
    router.get('/', noteController.list);

    // Protected routes require authentication
    router.post('/', authenticate, validateNote, noteController.create);
    router.put('/:id', authenticate, validateNote, noteController.update);
    router.delete('/:id', authenticate, noteController.delete);

    return router;
};

export default createNoteRoutes;