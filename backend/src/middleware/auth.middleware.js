import jwt  from 'jsonwebtoken';
import { User } from '../models/index.js';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            logger.warn('No authorization header present');
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
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            logger.warn(`User not found for token: ${decoded.id}`);
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('Token expired');
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        logger.error(`Authentication error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            logger.warn('Authorization attempted without authentication');
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by user: ${req.user.id}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        next();
    };
};

export { authenticate, authorize };