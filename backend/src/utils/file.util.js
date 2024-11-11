import { promises as fs } from 'fs';
import crypto from 'crypto';
import { join } from 'path';
import Logger from '../core/Logger.js';
import { Filedata } from '../models/index.js';

const logger = Logger.getInstance();

class FileUtil {
    static async addMetadata(filePath, filename) {
        try {
            logger.debug(`Adding metadata for file: ${filename}`);
            const metadata = await this.getMetadata(filePath);

            const filedata = await Filedata.create({
                sender: metadata.sender,
                receiver: metadata.receiver,
                hash: metadata.filehash,
                filename,
                size: metadata.size,
                created_at: metadata.timestamp,
            });

            logger.debug(`Metadata added: ${JSON.stringify(filedata)}`);
            return filedata;
        } catch (error) {
            logger.error(`Metadata addition failed: ${error.message}`);
            return null;
        }
    }

    static async calculateFileHash(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(fileBuffer).digest('hex');
        } catch (error) {
            logger.error(`Hash calculation failed: ${error.message}`);
            throw error;
        }
    }

    static async createUserDirectory(username, basePath) {
        const userDir = join(basePath, username);
        await fs.mkdir(userDir, { recursive: true });
        return userDir;
    }

    static generateStoragePath(hash, originalFilename) {
        // Create nested directory structure from hash
        const hashDirs = hash.match(/.{1,2}/g).slice(0, 3);
        return join(...hashDirs, hash, originalFilename);
    }

    static async getMetadata(filePath) {
        const filehash = await this.calculateFileHash(filePath);
        const stats = await fs.stat(filePath);

        const fileRecord = await Filedata.findOne({
            where: { hash: filehash }
        });

        return {
            sender: fileRecord?.sender || 'Unknown',
            receiver: fileRecord?.receiver || 'Unknown',
            filehash,
            size: stats.size,
            filename: path.basename(filePath),
            timestamp: stats.birthtime || new Date()
        };
    }
}

export { FileUtil };
export default FileUtil;