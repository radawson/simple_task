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
    upload = async (req, res) => {
        // ... existing upload logic
    }

    listFiles = async (req, res) => {
        try {
            const files = await Filedata.findAll({
                where: {
                    receiver: req.params.username
                }
            });

            logger.info(`Listed files for user: ${req.params.username}`);
            res.json(files);
        } catch (error) {
            logger.error(`File listing failed: ${error.message}`);
            res.status(500).json({ message: 'Failed to list files' });
        }
    }

    download = async (req, res) => {
        try {
            const filedata = await Filedata.findOne({
                where: {
                    receiver: req.params.username,
                    filename: req.params.filename
                }
            });

            if (!filedata) {
                return res.status(404).json({ message: 'File not found' });
            }

            const filePath = path.join(this.storagePath, filedata.path);
            res.download(filePath, filedata.filename);

            logger.info(`File downloaded: ${filedata.filename}`);
        } catch (error) {
            logger.error(`Download failed: ${error.message}`);
            res.status(500).json({ message: 'File download failed' });
        }
    }

    deleteFile = async (req, res) => {
        try {
            const filedata = await Filedata.findOne({
                where: {
                    receiver: req.params.username,
                    filename: req.params.filename
                }
            });

            if (!filedata) {
                return res.status(404).json({ message: 'File not found' });
            }

            const filePath = path.join(this.storagePath, filedata.path);
            await fs.unlink(filePath);
            await filedata.destroy();

            logger.info(`File deleted: ${filedata.filename}`);
            res.status(204).send();
        } catch (error) {
            logger.error(`File deletion failed: ${error.message}`);
            res.status(500).json({ message: 'File deletion failed' });
        }
    }



    verifyFile = async (req, res) => {
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