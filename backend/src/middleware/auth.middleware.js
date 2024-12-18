// src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import Logger from '../core/Logger.js';
import { User } from '../models/index.js';
import config from '../config/index.js';

const logger = Logger.getInstance();

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            logger.warn('No authorization header present');
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            logger.warn('Invalid authorization scheme');
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization scheme',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            logger.warn('No token provided');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided',
            });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Log the decoded token payload
        logger.info('Decoded token payload:', decoded);

        // Fetch the user from the database
        const user = await User.findByPk(decoded.id);

        if (!user) {
            logger.warn(`User not found for token: ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check token freshness for sensitive operations
        if (req.requiresFreshToken) {
            const tokenAge = Math.floor(Date.now() / 1000) - decoded.iat;
            if (tokenAge > 900) { // 15 minutes
                logger.warn(`Fresh token required for user: ${user.username}`);
                return res.status(401).json({
                    success: false,
                    message: 'Fresh token required',
                    code: 'TOKEN_REFRESH_REQUIRED',
                });
            }
        }

        // Attach the user to the request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        } else if (error.name === 'JsonWebTokenError') {
            logger.warn('Invalid token');
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        logger.error(`Authentication error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.warn('Authorization attempted without authentication');
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        // Check if user has the required role
        if (roles.length && !roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by user: ${req.user.id}`);
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};