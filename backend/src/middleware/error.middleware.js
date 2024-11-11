import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

/**
 * Custom application error class with additional properties for error handling
 */
class AppError extends Error {
    constructor(statusCode, message, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handles various Sequelize-specific errors
 */
const handleSequelizeError = (err) => {
    switch (err.name) {
        case 'SequelizeValidationError':
            return new AppError(400, 'Validation Error', {
                errors: err.errors.map(e => ({
                    field: e.path,
                    message: e.message,
                    value: e.value
                }))
            });
        case 'SequelizeUniqueConstraintError':
            return new AppError(409, 'Record already exists', {
                field: err.errors[0]?.path,
                value: err.errors[0]?.value
            });
        case 'SequelizeForeignKeyConstraintError':
            return new AppError(400, 'Invalid reference', {
                field: err.fields,
                message: 'Referenced record does not exist'
            });
        case 'SequelizeConnectionError':
            logger.error('Database connection error:', err);
            return new AppError(503, 'Service temporarily unavailable');
        default:
            return err;
    }
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle specific error types
    if (err.name && err.name.startsWith('Sequelize')) {
        err = handleSequelizeError(err);
    }

    const errorResponse = {
        status: err.status,
        message: err.message,
        ...(err.details && { details: err.details })
    };

    // Add additional information in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.path = req.path;
        errorResponse.method = req.method;

        logger.error('Error Details:', {
            ...errorResponse,
            body: req.body,
            user: req.user?.username,
            ip: req.ip
        });
    } else {
        // Production logging
        logger.error(`${err.status} ${err.statusCode}: ${err.message}`, {
            path: req.path,
            method: req.method,
            user: req.user?.username,
            ...(err.isOperational ? { details: err.details } : {})
        });

        // Hide internal error details in production
        if (!err.isOperational) {
            errorResponse.message = 'Internal Server Error';
            delete errorResponse.details;
        }
    }

    res.status(err.statusCode).json(errorResponse);
};

/**
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles 404 Not Found errors
 */
const notFound = (req, res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
};

export {
    AppError,
    errorHandler,
    asyncHandler,
    handleSequelizeError,
    notFound
};