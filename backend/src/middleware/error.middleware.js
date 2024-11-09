const Logger = require('../core/Logger');
const logger = Logger.getInstance();

class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const handleSequelizeError = (err) => {
    if (err.name === 'SequelizeValidationError') {
        return new AppError(400, err.errors.map(e => e.message).join(', '));
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
        return new AppError(400, 'Record already exists');
    }
    return err;
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        logger.error('Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            user: req.user?.username
        });

        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production error response
        if (err.isOperational) {
            logger.error(`Operational error: ${err.message}`);
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or unknown error
            logger.error('Unknown error:', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong'
            });
        }
    }
};

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const notFound = (req, res, next) => {
    const err = new AppError(404, `Route ${req.originalUrl} not found`);
    next(err);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFound
};