import { promises as fs } from 'fs';
import path from 'path';
import multer from 'multer';
import { Filedata } from '../models/index.js';
import FileUtil from '../utils/file.util.js';
import Logger from '../core/Logger.js';
import config from '../config/index.js';

const logger = Logger.getInstance();

class FileController {
    constructor(socketService) {
        if (!config.storage?.path) {
            throw new Error('Storage path not configured');
        }
        this.storagePath = config.storage.path;
        this.socketService = socketService;
        
        // Configure multer storage
        this.storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                try {
                    const tempPath = path.join(this.storagePath, 'temp');
                    await fs.mkdir(tempPath, { recursive: true });
                    cb(null, tempPath);
                } catch (err) {
                    cb(err);
                }
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

    handleUpload = async (req, res) => {
        return new Promise((resolve, reject) => {
            this.upload(req, res, (err) => {
                if (err) reject(err);
                else resolve(req.file);
            });
        });
    };

    upload = async (req, res) => {
        try {
            const file = await this.handleUpload(req, res);
            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Process the uploaded file
            const hash = await FileUtil.calculateFileHash(file.path);
            const storagePath = FileUtil.generateStoragePath(hash, file.originalname);
            const finalPath = path.join(this.storagePath, storagePath);

            // Ensure directory exists
            await fs.mkdir(path.dirname(finalPath), { recursive: true });
            
            // Move file from temp to final location
            await fs.rename(file.path, finalPath);

            // Create file record
            const filedata = await Filedata.create({
                filename: file.originalname,
                path: storagePath,
                hash,
                size: file.size,
                sender: req.user.username,
                receiver: req.params.username
            });

            // Notify via WebSocket if available
            if (this.socketService) {
                this.socketService.notifyUser(req.params.username, 'fileUploaded', {
                    filename: file.originalname,
                    sender: req.user.username
                });
            }

            logger.info(`File uploaded: ${file.originalname}`);
            res.status(201).json(filedata);

        } catch (error) {
            logger.error(`Upload failed: ${error.message}`);
            res.status(500).json({ message: 'File upload failed' });
        }
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
            
            // Check if file exists before sending
            await fs.access(filePath);
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

            // Notify via WebSocket if available
            if (this.socketService) {
                this.socketService.notifyUser(req.params.username, 'fileDeleted', {
                    filename: filedata.filename
                });
            }

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

export { FileController };
export default FileController;