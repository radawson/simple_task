const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../core/Logger');

const logger = Logger.getInstance();

class FileUtil {
    static async calculateFileHash(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(fileBuffer).digest('hex');
        } catch (error) {
            logger.error(`Hash calculation failed: ${error.message}`);
            throw error;
        }
    }

    static generateStoragePath(hash, originalFilename) {
        // Create nested directory structure from hash
        const hashDirs = hash.match(/.{1,2}/g).slice(0, 3);
        return path.join(...hashDirs, hash, originalFilename);
    }
}

module.exports = FileUtil;