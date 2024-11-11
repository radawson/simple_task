// src/routes/file.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateFile } from '../middleware/validation.middleware';
import FileController from '../controllers/file.controller';

const createFileRoutes = (socketService) => {
    const router = Router();
    const fileController = new FileController(socketService);

    // All routes require authentication
    router.post('/:username/:filename',
        authenticate,
        validateFile,
        fileController.upload
    );

    router.get('/:username',
        authenticate,
        fileController.listFiles
    );

    router.get('/:username/:filename',
        authenticate,
        fileController.download
    );

    router.delete('/:username/:filename',
        authenticate,
        fileController.deleteFile
    );

    return router;
};

export default createFileRoutes;