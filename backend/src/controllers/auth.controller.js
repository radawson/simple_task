const { User } = require('../models');
const Logger = require('../core/Logger');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

const logger = Logger.getInstance();

class AuthController {
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

            const token = jwt.sign(
                { id: user.id, username: user.username, isAdmin: user.isAdmin },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            logger.info(`User logged in successfully: ${username}`);
            res.json({ token });

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
                message: 'User registered successfully',
                userId: user.id 
            });

        } catch (error) {
            logger.error(`Registration error: ${error.message}`);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ message: 'Username already exists' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new AuthController();