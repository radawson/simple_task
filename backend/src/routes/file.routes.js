const router = require('express').Router();
const fileController = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateFile } = require('../middleware/validation.middleware');

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

module.exports = router;