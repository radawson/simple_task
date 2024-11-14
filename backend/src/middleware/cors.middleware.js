import cors from 'cors';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

const corsOptions = {
    origin: function (origin, callback) {
        logger.debug(`CORS Request from origin: ${origin}`);
        // Allow localhost:3000 and Postman (undefined origin)
        if (!origin || origin === 'http://localhost:3000') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

const corsMiddleware = cors(corsOptions);

// Enhanced CORS middleware with logging
const corsWithLogging = (req, res, next) => {
    logger.debug(`${req.method} ${req.path} - Request headers:`, {
        origin: req.headers.origin,
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Present' : 'None'
    });

    corsMiddleware(req, res, (err) => {
        if (err) {
            logger.error('CORS Error:', err);
            return res.status(403).json({
                success: false,
                message: 'CORS not allowed'
            });
        }
        next();
    });
};

export default corsWithLogging;
export { corsOptions };