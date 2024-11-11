import jwt from 'jsonwebtoken';
import Logger from '../core/Logger.js';
import config from '../config/index.js';
const logger = Logger.getInstance();

class JWTMiddleware {
    static generateAccessToken = (user) => {
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

    static generateRefreshToken = (user) => {
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not set');
        }
        return jwt.sign(
            {
                id: user.id,
                timestamp: Date.now() // Add timestamp to ensure uniqueness
            },
            process.env.JWT_REFRESH_SECRET,
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

            if (!authHeader.startsWith('Bearer ')) {
                logger.warn('Invalid authorization scheme');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid authorization scheme'
                });
            }

            const token = authHeader.split(' ')[1];

            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Check token freshness for sensitive operations
            const tokenAge = (Date.now() / 1000) - decoded.iat;
            if (req.requiresFreshToken && tokenAge > 900) {
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

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                logger.warn(`Token expired`);
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            logger.error(`Token verification error: ${error.message}`);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

export { JWTMiddleware };
export default JWTMiddleware;