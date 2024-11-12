// src/utils/config.util.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

class ConfigLoader {
    static loadEnvFile(envPath) {
        try {
            if (fs.existsSync(envPath)) {
                const envConfig = fs.readFileSync(envPath, 'utf8')
                    .split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .reduce((acc, line) => {
                        const [key, ...values] = line.split('=');
                        acc[key.trim()] = values.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
                        return acc;
                    }, {});

                // Merge with process.env but don't override existing values
                Object.keys(envConfig).forEach(key => {
                    if (!process.env[key]) {
                        process.env[key] = envConfig[key];
                    }
                });
            }
        } catch (error) {
            logger.warn(`Failed to load env file ${envPath}: ${error.message}`);
        }
    }

    static init() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const rootDir = join(__dirname, '../../');

        // Load environment-specific .env file first
        const envFile = process.env.NODE_ENV === 'production' 
            ? '.env.production'
            : process.env.NODE_ENV === 'test'
                ? '.env.test'
                : '.env.development';

        this.loadEnvFile(join(rootDir, envFile));

        // Load default .env file as fallback
        this.loadEnvFile(join(rootDir, '.env'));

        // Validate critical environment variables
        const requiredVars = [
            'DB_TYPE',
            'DB_NAME',
            'NODE_ENV',
            'PORT',
            'SPORT'
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Log loaded configuration (excluding sensitive data)
        logger.debug('Loaded environment configuration:', {
            NODE_ENV: process.env.NODE_ENV,
            DB_TYPE: process.env.DB_TYPE,
            DB_HOST: process.env.DB_HOST,
            DB_PORT: process.env.DB_PORT,
            DB_NAME: process.env.DB_NAME,
            PORT: process.env.PORT,
            SPORT: process.env.SPORT
        });
    }
}

export default ConfigLoader;