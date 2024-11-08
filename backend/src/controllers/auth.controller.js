const { User } = require('../models');
const Logger = require('../core/Logger');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const crypto = require('crypto');
const config = require('../config');

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
    }

    async initializeOIDC() {
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

    async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await User.findOne({ where: { username } });
            if (!user) {
                logger.warn(`Login attempt failed for non-existent user: ${username}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const validPassword = await argon2.verify(user.password, password);
            if (!validPassword) {
                logger.warn(`Invalid password attempt for user: ${username}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            await this.saveSession(user.id, refreshToken);

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

    async register(req, res) {
        try {
            const { username, password, email, firstName, lastName } = req.body;
            const hashedPassword = await argon2.hash(password);
            
            const user = await User.create({
                username,
                password: hashedPassword,
                email,
                firstName,
                lastName
            });

            logger.info(`New user registered: ${username}`);
            res.status(201).json({ 
                message: 'Registration successful',
                userId: user.id 
            });
        } catch (error) {
            logger.error(`Registration failed: ${error.message}`);
            res.status(400).json({ message: 'Registration failed' });
        }
    }

    async logout(req, res) {
        try {
            // Clear session/token logic here
            res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            logger.error(`Logout failed: ${error.message}`);
            res.status(500).json({ message: 'Logout failed' });
        }
    }

    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            const accessToken = this.generateAccessToken(user);
            res.json({ accessToken });

        } catch (error) {
            logger.error(`Token refresh error: ${error.message}`);
            res.status(401).json({ message: 'Invalid refresh token' });
        }
    }


    async initiateSSO(req, res) {
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

    async handleSSOCallback(req, res) {
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

    generateAccessToken(user) {
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

    generateRefreshToken(user) {
        return jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    async saveSession(userId, refreshToken) {
        // Implement session storage logic
    }
}

module.exports = new AuthController();