const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Filedata = require('../models/filedata.model');
const Prosody = require('../models/prosody.model');
const { sequelize } = require('../database');
const config = require('../config');
const logger = require('../logger');

/**
 * Adds metadata to the Filedata model for a given file.
 * 
 * @param {string} filePath - The path to the file.
 * @param {string} filename - The name of the file.
 * @returns {Promise<object|null>} The updated Filedata entry or null if an error occurred.
 */
async function addMetadata(filePath, filename) {
    try {
        logger.debug(`Adding metadata for file: ${filename}`);
        
        // Get metadata from the file
        const { sender, receiver, timestamp, filehash, size } = await getMetadata(filePath);
        
        // Add the metadata to the Filedata model
        const updatedFiledata = await Filedata.create({
            sender,
            receiver,
            hash: filehash,
            filename,
            size,
            created_at: timestamp,
        });
        
        logger.debug(`Metadata added to filedata model: ${JSON.stringify(updatedFiledata)}`);
        return updatedFiledata;
    } catch (error) {
        logger.error(`Error adding metadata to filedata model:`, error);
        return null;
    }
}

/**
 * Checks if the user exists in the Prosody model based on the provided username and host.
 * 
 * @param {string} username - The username to check.
 * @param {string} host - The host (domain) of the user.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
async function checkUser(username, host) {
    logger.debug(`Prosody Model: ${!!Prosody ? 'Loaded' : 'Not Loaded'}`);

    // Check if user exists in the 'accounts' store
    const params = {
        "user": username,
        "host": host,
        "store": "accounts",
        "key": "stored_key",
    };
    logger.debug(`Checking user ${username} on ${host} with params: ${JSON.stringify(params)}`);

    try {
        const userExists = await Prosody.findOne({
            where: params
        });

        logger.debug(`User ${username} exists on ${host}: ${!!userExists}`);
        return !!userExists;
    } catch (error) {
        logger.error(`Error checking user ${username} on ${host}:`, error);
        return false;
    }
}

/**
 * Creates a user directory if it doesn't already exist.
 * 
 * @param {string} username - The username for whom the directory will be created.
 * @param {string} uploadPath - The base path where user directories are stored.
 * @returns {string} The path to the user directory.
 */
function createUserDirectory(username, uploadPath) {
    const userDir = path.join(uploadPath, username);

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
}

/**
 * Check if a specific table exists in the database.
 * @param {string} tableName - Name of the table to check.
 * @returns {Promise<boolean>} - True if the table exists, false otherwise.
 */
async function doesTableExist(tableName) {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        return tables.includes(tableName);
    } catch (error) {
        console.error(`Error checking if table ${tableName} exists:`, error);
        return false;
    }
}


/**
 * Retrieves metadata for a given file, such as sender, receiver, hash, size, and timestamp.
 * 
 * @param {string} filePath - The full path to the file.
 * @returns {Promise<object>} The file metadata, including sender, receiver, hash, size, and timestamp.
 */
async function getMetadata(filePath) {
    const filehash = await getSha256Hash(filePath);
    const fileStat = fs.statSync(filePath); // This fetches file stats like size and creation time

    let size = fileStat.size;
    let filename = path.basename(filePath);  // Extract filename from path
    let timestamp = fileStat.birthtime || new Date();  // File creation time or fallback to current date

    // Attempt to find sender and receiver from existing metadata in the database
    let fileRecord = await Filedata.findOne({ where: { hash: filehash } });
    let sender = fileRecord ? fileRecord.sender : 'Unknown';
    let receiver = fileRecord ? fileRecord.receiver : 'Unknown';

    return {
        sender,
        receiver,
        filehash,
        size,
        filename,
        timestamp
    };
}

/**
 * Generates a SHA-256 hash for a given file.
 * 
 * @param {string} filePath - The path to the file to be hashed.
 * @returns {Promise<string>} The SHA-256 hash of the file.
 */
async function getSha256Hash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

module.exports = { addMetadata, checkUser, createUserDirectory, doesTableExist, getMetadata, getSha256Hash };
