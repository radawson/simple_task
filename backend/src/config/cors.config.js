// src/config/cors.config.js
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

export const createCorsMiddleware = (config) => {
    if (!config?.server?.cors?.origins) {
        logger.warn('No CORS origins configured, defaulting to localhost:3000');
    }

    const origins = config?.server?.cors?.origins || ['http://localhost:3000'];
    const credentials = config?.server?.cors?.credentials ?? true;

    logger.debug('Configuring CORS with:', { origins, credentials });

    const corsOptions = {
        origin: (origin, callback) => {
            logger.debug(`CORS Request from origin: ${origin}`);
            
            // Allow requests with no origin (like mobile apps, curl)
            if (!origin) {
                callback(null, true);
                return;
            }

            // Check if origin is allowed
            if (origins.includes('*') || origins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    };

    return corsOptions;
};