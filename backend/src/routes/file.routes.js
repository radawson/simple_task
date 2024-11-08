const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const verifyToken = require('../middleware/jwt.middleware');

// Define the headers middleware for CORS and other preflight checks
router.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

/**
 * POST /api/files/:username/:filename
 * Purpose: Upload a file
 */
router.post('/:username/:filename', verifyToken, fileController.upload);

/** 
 * GET /api/files/:username
 * Purpose: List all files for a user
 */
router.get('/:username', verifyToken, fileController.listFiles);

/**
 * GET /api/files/:username/:filename
 * Purpose: Download a specific file
 */
router.get('/:username/:filename', verifyToken, fileController.download);

/**
 * DELETE /api/files/:username/:filename
 * Purpose: Delete a specific file
 */
router.delete('/:username/:filename', verifyToken, fileController.deleteFile);

module.exports = router;
