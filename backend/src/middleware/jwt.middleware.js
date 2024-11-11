import jwt from 'jsonwebtoken';
import Logger from '../core/Logger.js';
import config from '../config/index.js';
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
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_REFRESH_SECRET is not set');
        }
        return jwt.sign(
            {
                id: user.id,
                timestamp: Date.now()
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: config.jwt.refreshTokenExpiry }
        );
    }

    static verifyTokenPayload(token) {
        logger.debug('Verifying token payload:', token);
        return jwt.verify(token, config.jwt.secret);
    }
}

export const { generateAccessToken, generateRefreshToken, verifyTokenPayload } = JWTMiddleware;
export default JWTMiddleware;