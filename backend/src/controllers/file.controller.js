const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { Filedata } = require('../models');
const FileUtil = require('../utils/file.util');
const Logger = require('../core/Logger');
const config = require('../config');

const logger = Logger.getInstance();

class FileController {
    constructor() {
        if (!config.storage?.path) {
            throw new Error('Storage path not configured');
        }
        this.storagePath = config.storage.path;
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const tempPath = path.join(this.storagePath, 'temp');
                fs.mkdir(tempPath, { recursive: true })
                    .then(() => cb(null, tempPath))
                    .catch(err => cb(err));
            },
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}-${file.originalname}`);
            }
        });
        this.upload = multer({ 
            storage: this.storage,
            limits: {
                fileSize: config.storage.maxFileSize
            }
        }).single('file');
    }

    async handleUpload(req, res) {
        try {
            const tempFilePath = req.file.path;
            const hash = await FileUtil.calculateFileHash(tempFilePath);
            const relativePath = FileUtil.generateStoragePath(hash, req.file.originalname);
            const finalPath = path.join(this.storagePath, relativePath);

            // Create directory structure
            await fs.mkdir(path.dirname(finalPath), { recursive: true });
            
            // Move file to final location
            await fs.rename(tempFilePath, finalPath);

            // Store metadata
            const filedata = await Filedata.create({
                sender: req.user.username,
                receiver: req.params.username,
                hash: hash,
                size: req.file.size,
                filename: req.file.originalname,
                path: relativePath
            });

            logger.info(`File uploaded: ${hash} by ${req.user.username}`);
            res.status(201).json({
                message: 'File uploaded successfully',
                fileId: filedata.id
            });

        } catch (error) {
            logger.error(`Upload failed: ${error.message}`);
            res.status(500).json({ message: 'File upload failed' });
        }
    }

    async verifyFile(req, res) {
        try {
            const { hash } = req.params;
            const filedata = await Filedata.findOne({ where: { hash } });

            if (!filedata) {
                return res.status(404).json({ message: 'File not found' });
            }

            const filePath = path.join(this.storagePath, filedata.path);
            const calculatedHash = await FileUtil.calculateFileHash(filePath);

            if (calculatedHash !== hash) {
                logger.warn(`File integrity check failed for hash: ${hash}`);
                return res.status(400).json({ message: 'File integrity check failed' });
            }

            res.json({ 
                verified: true,
                metadata: {
                    filename: filedata.filename,
                    size: filedata.size,
                    sender: filedata.sender
                }
            });

        } catch (error) {
            logger.error(`Verification failed: ${error.message}`);
            res.status(500).json({ message: 'File verification failed' });
        }
    }
}

module.exports = new FileController();