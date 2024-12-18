const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const Logger = require('../core/Logger');

const logger = Logger.getInstance();

class SecretUtil {
    static async ensureSecrets() {
        try {
            const envPath = path.join(process.cwd(), '.env');
            let envContent = await fs.readFile(envPath, 'utf8');
            let modified = false;

            // Check JWT_SECRET
            if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
                const jwtSecret = crypto.randomBytes(64).toString('hex');
                process.env.JWT_SECRET = jwtSecret;
                
                if (envContent.includes('JWT_SECRET=')) {
                    envContent = envContent.replace(/JWT_SECRET=.*\n/, `JWT_SECRET=${jwtSecret}\n`);
                } else {
                    envContent += `\nJWT_SECRET=${jwtSecret}`;
                }
                modified = true;
                logger.info('Generated new JWT_SECRET');
            }

            // Check JWT_REFRESH_SECRET
            if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.trim() === '') {
                const refreshSecret = crypto.randomBytes(64).toString('hex');
                process.env.JWT_REFRESH_SECRET = refreshSecret;
                
                if (envContent.includes('JWT_REFRESH_SECRET=')) {
                    envContent = envContent.replace(/JWT_REFRESH_SECRET=.*\n/, `JWT_REFRESH_SECRET=${refreshSecret}\n`);
                } else {
                    envContent += `\nJWT_REFRESH_SECRET=${refreshSecret}`;
                }
                modified = true;
                logger.info('Generated new JWT_REFRESH_SECRET');
            }

            if (modified) {
                await fs.writeFile(envPath, envContent);
                logger.info('Updated .env file with new secrets');
            }

        } catch (error) {
            logger.error(`Failed to ensure secrets: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SecretUtil;