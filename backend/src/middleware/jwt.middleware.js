const jwt = require('jsonwebtoken');
const Logger = require('../core/Logger');
const config = require('../config');
const logger = Logger.getInstance();

class JWTMiddleware {
    static generateAccessToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin
            },
            config.jwt.secret,
            { expiresIn: config.jwt.accessTokenExpiry }
        );
    }

    static generateRefreshToken(user) {
        return jwt.sign(
            { id: user.id },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshTokenExpiry }
        );
    }

    static verifyToken = (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];

            if (!authHeader) {
                logger.warn('Authorization header missing');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Check Bearer scheme
            if (!authHeader.startsWith('Bearer ')) {
                logger.warn('Invalid authorization scheme');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authorization scheme'
                });
            }

            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        logger.warn(`Token expired for user: ${decoded?.username || 'unknown'}`);
                        return res.status(401).json({
                            success: false,
                            message: 'Token expired',
                            code: 'TOKEN_EXPIRED'
                        });
                    }

                    logger.warn(`Token verification failed: ${err.message}`);
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token',
                        code: 'TOKEN_INVALID'
                    });
                }

                // Check token freshness for sensitive operations
                const tokenAge = (Date.now() / 1000) - decoded.iat;
                if (req.requiresFreshToken && tokenAge > 900) { // 15 minutes
                    logger.warn(`Fresh token required for user: ${decoded.username}`);
                    return res.status(401).json({
                        success: false,
                        message: 'Fresh token required',
                        code: 'TOKEN_REFRESH_REQUIRED'
                    });
                }

                req.user = decoded;
                logger.debug(`Token verified for user: ${decoded.username}`);
                next();
            });
        } catch (error) {
            logger.error(`Token verification error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

module.exports = JWTMiddleware;