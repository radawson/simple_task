// src/config/cors.config.js
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

export const createCorsMiddleware = (config) => {
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, REST tools, etc)
            if (!origin) {
                callback(null, true);
                return;
            }

            const origins = config?.server?.cors?.origins || ['http://localhost:3000'];
            if (origins.includes(origin) || origins.includes('*')) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    };

    return corsOptions;
};