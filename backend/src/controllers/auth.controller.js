import { User, Session } from '../models/index.js';
import Logger from '../core/Logger.js';
import jwt  from 'jsonwebtoken';
import argon2 from 'argon2';
import crypto from 'crypto';
import config from '../config/index.js';
import JWTMiddleware from '../middleware/jwt.middleware.js';
import { Op } from 'sequelize';

const logger = Logger.getInstance();

class AuthController {
    constructor() {
        this.client = null;
        if (config.oidc.enabled) {
            this.initializeOIDC().catch(error => {
                logger.error(`OIDC initialization failed: ${error.message}`);
            });
        } else {
            logger.info('OIDC/SSO is disabled');
        }
        // Store interval reference for cleanup
        this.cleanupInterval = setInterval(
            () => this.cleanupSessions(),
            24 * 60 * 60 * 1000
        );
    }

    cleanupSessions = async () => {
        try {
            const result = await Session.destroy({
                where: {
                    [Op.or]: [
                        { expiresAt: { [Op.lt]: new Date() } },
                        { isValid: false }
                    ]
                }
            });
            logger.debug(`Cleaned up ${result} expired sessions`);
        } catch (error) {
            logger.error(`Session cleanup failed: ${error.message}`);
        }
    }

    generateAccessToken = (user) => {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    }

    generateRefreshToken = (user) => {
        return jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    handleSSOCallback = async (req, res) => {
        try {
            const params = this.client.callbackParams(req);
            const tokenSet = await this.client.callback(
                process.env.OIDC_REDIRECT_URI,
                params
            );

            const userInfo = await this.client.userinfo(tokenSet.access_token);
            let user = await User.findOne({ where: { email: userInfo.email } });

            if (!user) {
                user = await User.create({
                    email: userInfo.email,
                    username: userInfo.preferred_username,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name
                });
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            res.json({ accessToken, refreshToken });

        } catch (error) {
            logger.error(`SSO callback error: ${error.message}`);
            res.status(500).json({ message: 'SSO authentication failed' });
        }
    }

    initializeOIDC = async () => {
        try {
            const { Issuer } = await import('openid-client');
            const issuer = await Issuer.discover(process.env.OIDC_ISSUER_URL);
            this.client = new issuer.Client({
                client_id: process.env.OIDC_CLIENT_ID,
                client_secret: process.env.OIDC_CLIENT_SECRET,
                redirect_uris: [process.env.OIDC_REDIRECT_URI],
                response_types: ['code']
            });
            logger.info('OIDC client initialized successfully');
        } catch (error) {
            logger.error(`OIDC initialization failed: ${error.message}`);
            throw error;
        }
    }

    initiateSSO = async (req, res) => {
        if (!config.oidc.enabled) {
            logger.warn('SSO attempted but disabled');
            return res.status(404).json({
                message: 'SSO is not enabled'
            });
        } else {
            try {
                const authUrl = this.client.authorizationUrl({
                    scope: 'openid profile email',
                    state: crypto.randomBytes(16).toString('hex')
                });
                res.redirect(authUrl);
            } catch (error) {
                logger.error(`SSO initiation error: ${error.message}`);
                res.status(500).json({ message: 'SSO initialization failed' });
            }
        }
    }

    login = async (req, res) => {
        logger.debug('Processing login request');
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ where: { username } });

            if (!user || !(await argon2.verify(user.password, password))) {
                logger.warn(`Login failed for user: ${username}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = JWTMiddleware.generateAccessToken(user);
            const refreshToken = JWTMiddleware.generateRefreshToken(user);

            await this.saveSession(user.id, refreshToken, req);

            logger.info(`User logged in successfully: ${username}`);
            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    isAdmin: user.isAdmin
                }
            });

        } catch (error) {
            logger.error(`Login error: ${error.message}`);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    logout = async (req, res) => {
        try {
            const userId = req.user.id;

            // Invalidate all user sessions
            await Session.update(
                { isValid: false },
                { where: { userId, isValid: true } }
            );

            logger.info(`User logged out: ${req.user.username}`);
            res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            logger.error(`Logout failed: ${error.message}`);
            res.status(500).json({ message: 'Logout failed' });
        }
    }

    register = async (req, res) => {
        try {
            const { username, password, email, firstName, lastName } = req.body;
            const hashedPassword = await argon2.hash(password);

            const user = await User.create({
                username,
                password: hashedPassword,
                email,
                firstName,
                lastName,
                isAdmin: false,
                isActive: true
            });

            logger.info(`New user registered: ${username}`);
            res.status(201).json({
                message: 'Registration successful',
                userId: user.id
            });
        } catch (error) {
            logger.error(`Registration failed: ${error.message}`);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    message: 'Username or email already exists'
                });
            }
            res.status(400).json({ message: error.message });
        }
    }

    refreshToken = async (req, res) => {
        logger.debug('Refresh token request received');
    
        // Validate content type
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            logger.warn(`Invalid content type: ${contentType}`);
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json'
            });
        }
    
        // Validate refresh token exists in body
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Missing refresh token in request body');
            return res.status(400).json({
                success: false,
                message: 'refresh_token is required in request body'
            });
        }
    
        try {
            const session = await Session.findOne({
                where: {
                    refreshToken,
                    isValid: true,
                    expiresAt: {
                        [Op.gt]: new Date()
                    }
                },
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'isAdmin', 'isActive']
                }]
            });
    
            if (!session?.User?.isActive) {
                logger.warn('Invalid or inactive user for refresh token');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
    
            // Generate new tokens with unique timestamp
            const newAccessToken = JWTMiddleware.generateAccessToken(session.User);
            const newRefreshToken = JWTMiddleware.generateRefreshToken(session.User);
    
            // Verify tokens are different
            if (newRefreshToken === refreshToken) {
                logger.error('Generated refresh token matches old token');
                throw new Error('Token generation error');
            }
    
            // Update session
            await session.update({
                refreshToken: newRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
    
            logger.info(`Tokens refreshed for user: ${session.User.username}`);
            return res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });
    
        } catch (error) {
            logger.error(`Refresh token error: ${error.message}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    saveSession = async (userId, refreshToken, req) => {
        try {
            // Invalidate old sessions for this user
            await Session.update(
                { isValid: false },
                { where: { userId, isValid: true } }
            );

            // Create new session with request info
            await Session.create({
                userId,
                refreshToken,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                isValid: true
            });

            logger.debug(`Session created for user: ${userId}`);
        } catch (error) {
            logger.error(`Session creation failed: ${error.message}`);
            throw error;
        }
    }
}

export { AuthController };
export default AuthController;