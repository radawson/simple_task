const db = require('../database');
const Prosody = require('../models/prosody.model');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../logger');

// Access the User model via the database module
const User = db.User;

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Step 1: Find the user by username
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Step 2: Verify the password using Argon2
        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Step 3: Generate JWT for authenticated users
        const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, {
            expiresIn: '1h', // Token expires in 1 hour
        });

        res.status(200).json({ message: 'Login successful!', token });
    } catch (error) {
        logger.error('Error during user login:', error);
        res.status(500).json({ error: 'Failed to log in.' });
    }
};

// Logout endpoint to invalidate the JWT (no server-side storage needed for JWT)
exports.logout = (req, res) => {
    // This route simply sends a success message; the client should handle token removal.
    logger.info('User logged out.');
    return res.status(200).json({ message: 'Logged out successfully.' });
};


exports.register = async (req, res) => {
    const { username, password, host } = req.body;
    const { stored_key, server_key, salt, iteration_count } = req.derivedKeys;

    try {
        logger.debug(`Registration attempt for user: ${username}@${host}`);

        // Step 1: Check if the user already exists in the internal user model
        const existingUser = await db.User.findOne({ where: { username, host } });
        if (existingUser) {
            logger.warn(`User already exists in internal model: ${username}@${host}`);
            return res.status(409).json({ message: 'User already exists.' });
        }

        // Step 2: Check if the Prosody table exists
        const Prosody = db.getProsodyModel();
        if (Prosody) {
            // Step 3: Check if the user already exists in the Prosody model
            const prosodyUser = await db.Prosody.findOne({ where: { user: username, host, store: 'accounts' } });
            if (prosodyUser) {
                logger.warn(`User already exists in Prosody model: ${username}@${host}`);
                return res.status(409).json({ message: 'User already exists in Prosody.' });
            }

            // Step 4: Add Prosody compatibility entries
            logger.debug(`Creating Prosody compatibility entries for user: ${username}@${host}`);
            const entries = [
                { host, user: username, store: 'accounts', key: 'stored_key', type: 'string', value: stored_key },
                { host, user: username, store: 'accounts', key: 'server_key', type: 'string', value: server_key },
                { host, user: username, store: 'accounts', key: 'iteration_count', type: 'number', value: iteration_count.toString() },
                { host, user: username, store: 'accounts', key: 'salt', type: 'string', value: salt },
            ];
            await db.Prosody.bulkCreate(entries);
            logger.info(`Prosody compatibility entries created for user: ${username}@${host}`);
        } else {
            logger.info('Prosody table not found; skipping compatibility entries.');
        }

        // Step 5: Hash the password using Argon2
        const hashedPassword = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });

        // Step 6: Create a new user in the internal user model
        const newUser = await db.User.create({
            username,
            password: hashedPassword,
            host,
            type: 'account',
        });
        logger.info(`User created in internal model: ${username}@${host}`);

        res.status(201).json({ message: 'User registered successfully!', newUser });
    } catch (error) {
        logger.error('Error during user registration:', error);
        res.status(500).json({ error: 'Failed to register user.' });
    }
};