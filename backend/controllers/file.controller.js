const fs = require('fs');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { notifyFileAvailable } = require('../websocket');
const { addMetadata, checkUser, createUserDirectory, getMetadata, getSha256Hash } = require('./helpers');
const config = require('../config');
const logger = require('../logger');

// Access the Filedata model via the database module
const Filedata = db.Filedata;

const storagePath = config.STORAGE_PATH || path.join(__dirname, '..', 'uploads');

// Setup Multer Storage for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { username } = req.params;
        const host = req.hostname;

        // Check if the user is valid and create the user directory
        checkUser(username, host).then(isValid => {
            if (!isValid) {
                return cb(new Error('Invalid user.'));
            }

            const userDir = createUserDirectory(username, storagePath);
            cb(null, userDir);
        }).catch(err => {
            logger.error(err);
            return cb(new Error('Error during user check.'));
        });
    },
    filename: (req, file, cb) => {
        const { filename } = req.params;
        cb(null, filename); // Use the filename from the request
    }
});

// Configure Multer to handle file upload with both file and metadata fields
// const m_upload = multer({
//     storage: storage,
//     limits: { fileSize: 100 * 1024 * 1024 } // Set file size limit, e.g., 100MB
// }).fields([
//     { name: 'file', maxCount: 1 },           // Accept one file
//     { name: 'metadata', maxCount: 1 }        // Accept one metadata field
// ]);

//Fallback config for testing
const m_upload = multer({ storage: storage }).fields([
    { name: 'file', maxCount: 1 },           // Accept one file
    { name: 'metadata', maxCount: 1 }        // Accept one metadata field
]);

/**
 * Uploads a file to the server, saves its metadata, and notifies clients of availability.
 * 
 * @param {object} req - The request object containing file and metadata.
 * @param {object} res - The response object to send back the result.
 * @returns {void}
 */
exports.upload = (req, res) => {
    m_upload(req, res, async (err) => {
        const { username, filename } = req.params;
        const filePath = path.join(storagePath, username, filename);

        if (err) {
            logger.error('File upload error:', err);
            return res.status(500).json({ error: 'File upload failed.' });
        }

         // Log the actual file size on disk
         const fileStat = fs.statSync(filePath);
         logger.debug(`Uploaded file size: ${fileStat.size} bytes`);

        try {
            logger.debug(`File uploaded: ${filePath} with metadata: ${JSON.stringify(req.files.metadata)}`);

            // Add metadata to the database
            await addMetadata(filePath, filename);

            // Notify clients that the file is available
            notifyFileAvailable(filename, username, req.hostname);

            // Return success response
            res.status(201).json({ message: 'File uploaded successfully.' });
        } catch (error) {
            logger.error('Error handling upload:', error);
            res.status(500).json({ error: 'Error processing upload.' });
        }
    });
};

/**
 * Lists all files for a user, including metadata such as file size, sender, receiver, etc.
 * 
 * @param {object} req - The request object containing the username.
 * @param {object} res - The response object to send back the list of files.
 * @returns {Promise<void>}
 */
exports.listFiles = async (req, res) => {
    const { username } = req.params;
    const host = req.hostname; // Get the host dynamically

    // Check if user exists
    const userIsValid = await checkUser(username, host);
    if (!userIsValid) {
        return res.status(403).json({ message: 'Invalid user.' });
    }

    const userDir = createUserDirectory(username, storagePath);

    try {
        if (!fs.existsSync(userDir)) {
            logger.debug(`User directory does not exist: ${userDir}`);
            return res.status(418).json({ message: 'User directory does not exist.' });
        }

        // Retrieve metadata for each file
        const files = await Promise.all(fs.readdirSync(userDir).map(async (file) => {
            const filePath = path.join(userDir, file);
            const { sender, receiver, timestamp, filehash, size } = await getMetadata(filePath);  // Ensure metadata is awaited

            return {
                from: sender,
                to: receiver,
                filename: file,
                size: size,
                sha256: filehash,
                timestamp: timestamp
            };
        }));

        res.status(200).json({ files });
    } catch (error) {
        logger.error('Error listing files:', error);
        res.status(500).json({ error: 'Unable to list files.' });
    }
};

/**
 * Downloads a specific file for a user.
 * 
 * @param {object} req - The request object containing username and filename.
 * @param {object} res - The response object for streaming the file download.
 * @returns {void}
 */
exports.download = (req, res) => {
    const { username, filename } = req.params;
    const filePath = path.join(storagePath, username, filename);

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found.' });
    }

    res.download(filePath, filename, (err) => {
        if (err) {
            logger.error(err);
            res.status(500).json({ error: 'Failed to download file.' });
        }
        logger.debug(`File downloaded: ${filePath}`);
    });
};

/**
 * Deletes a specific file for a user, removes it from the filesystem, and deletes metadata from the database.
 * 
 * @param {object} req - The request object containing username and filename.
 * @param {object} res - The response object to confirm the deletion.
 * @returns {Promise<void>}
 */
exports.deleteFile = async (req, res) => {
    const { username, filename } = req.params;
    const filePath = path.join(storagePath, username, filename);
    const { filehash } = await getMetadata(filePath);

    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
        logger.debug(`File not found: ${filePath}`);
        return res.status(404).json({ error: 'File not found.' });
    }

    fs.unlink(filePath, async (err) => {
        if (err) {
            logger.error(err);
            return res.status(500).json({ error: 'Failed to delete file.' });
        }

        // Delete file entry from the database
        await Filedata.destroy({ where: { hash: filehash } });

        logger.debug(`File deleted: ${filePath}`);
        res.status(200).json({ message: 'File deleted successfully.' });
    });
};
