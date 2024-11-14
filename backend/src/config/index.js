//src/config/index.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import ConfigLoader from '../utils/config.util.js';
import { configSchema } from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize environment configuration
ConfigLoader.init();

class Config {
    static #instance;
    #config;

    constructor() {
        if (Config.#instance) {
            return Config.#instance;
        }

        this.#config = this.#loadConfig();
        Object.freeze(this.#config);
        Config.#instance = this;
    }

    #loadConfig() {
        dotenv.config();

        // Dynamic import for secrets manager
        const getSecrets = async () => {
            const { default: SecretsManager } = await import('../utils/secrets.manager.js');
            return SecretsManager.getInstance();
        };

        const config = {
            env: process.env.NODE_ENV || 'development',
            serverUid: process.env.SERVER_UID || crypto.randomBytes(4).toString('hex'),
            chat: {
                enabled: process.env.ENABLE_CHAT === 'true',
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD
                },
                fcm: {
                    serviceAccount: process.env.FCM_SERVICE_ACCOUNT,
                    projectId: process.env.FCM_PROJECT_ID
                }
            },
            database: {
                type: process.env.DB_TYPE || 'sqlite',
                database: process.env.DB_NAME || 'stasks',
                ...(process.env.DB_TYPE === 'postgres' && {
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT),
                    username: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    ssl: process.env.DB_SSL === 'true'
                })
            },
            jwt: {
                secret: process.env.JWT_SECRET,
                refreshSecret: process.env.JWT_REFRESH_SECRET,
                accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
                refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
            },
            logger: {
                level: process.env.LOG_LEVEL || 'info',
                directory: join(__dirname, '../../logs'),
                maxFiles: '14d',
                format: process.env.LOG_FORMAT || 'json'
            },
            oidc: {
                enabled: process.env.ENABLE_SSO === 'true',
                issuerUrl: process.env.OIDC_ISSUER_URL,
                clientId: process.env.OIDC_CLIENT_ID,
                clientSecret: process.env.OIDC_CLIENT_SECRET,
                redirectUri: process.env.OIDC_REDIRECT_URI,
                postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI,
                scope: process.env.OIDC_SCOPE || 'openid profile email',
                responseType: 'code',
                pkce: true,
                timeout: parseInt(process.env.OIDC_TIMEOUT) || 5000
            },
            security: {
                rateLimiting: {
                    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
                    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
                },
                helmet: {
                    contentSecurityPolicy: {
                        directives: {
                            defaultSrc: ["'self'"],
                            scriptSrc: ["'self'", "'unsafe-inline'"],
                            styleSrc: ["'self'", "'unsafe-inline'"],
                            imgSrc: ["'self'", "data:", "https:"],
                        }
                    }
                }
            },
            server: {
                port: parseInt(process.env.PORT) || 3000,
                sslPort: parseInt(process.env.SPORT) || 3003,
                sslKey: process.env.SSL_KEY_PATH,
                sslCert: process.env.SSL_CERT_PATH,
                sslChain: process.env.SSL_CHAIN_PATH,
                sslTrustPath: process.env.SSL_TRUST_PATH,
                cors: {  
                    origins: process.env.CORS_ALLOWED_ORIGINS ? 
                        process.env.CORS_ALLOWED_ORIGINS.split(',')
                            .map(origin => origin.trim())
                            .filter(Boolean) : 
                        ['http://localhost:3000'],
                    credentials: true
                }
            },
            storage: {
                path: process.env.STORAGE_PATH || join(__dirname, '../../storage'),
                tempPath: process.env.TEMP_STORAGE_PATH || join(__dirname, '../../storage/temp'),
                maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024,
            }
        };

        const { error } = configSchema.validate(config);
        if (error) {
            throw new Error(`Config validation error: ${error.message}`);
        }

        // Add debug logging for database config
        this.logger?.debug('Database configuration:', {
            type: config.database.type,
            host: config.database.host,
            port: config.database.port,
            database: config.database.database,
            ssl: config.database.ssl
        });

        return config;
    }

    async initialize() {
        // Handle async operations like secret loading
        const { default: SecretsManager } = await import('../utils/secrets.manager.js');
        const secretsManager = SecretsManager.getInstance();

        // Add secrets to JWT config
        this.#config.jwt.secret = process.env.JWT_SECRET || await secretsManager.getSecret('JWT_SECRET');
        this.#config.jwt.refreshSecret = process.env.JWT_REFRESH_SECRET || await secretsManager.getSecret('JWT_REFRESH_SECRET');

        return this.#config;
    }

    get() {
        return this.#config;
    }

    static getInstance() {
        if (!Config.#instance) {
            Config.#instance = new Config();
        }
        return Config.#instance;
    }
}

// Create and export the config instance
const configInstance = new Config();
const config = await configInstance.initialize();

export { Config };  // Named export for the class if needed
export default config;  // Default export for the config object