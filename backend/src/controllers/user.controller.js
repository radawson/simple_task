import { User } from '../models/index.js';
import { Op } from 'sequelize';
import Logger from '../core/Logger.js';
import argon2 from 'argon2';
import crypto from 'crypto';
const logger = Logger.getInstance();

/**
 * Controller handling user-related operations
 */
class UserController {
    /**
     * Activate a user account
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    activateUser = async (req, res) => {
        try {
            logger.info('Attempting to activate user', { userId: req.params.id });

            const user = await User.findByPk(req.params.id);
            if (!user) {
                logger.warn('User not found for activation', { userId: req.params.id });
                return res.status(404).json({ message: 'User not found' });
            }

            await user.update({ isActive: true });
            logger.info('User activated successfully', { userId: user.id });
            return res.json(user);
        } catch (error) {
            logger.error('User activation failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id
            });
            return res.status(500).json({ message: 'Failed to activate user' });
        }
    };

    /**
     * Create a new user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    create = async (req, res) => {
        try {
            logger.info('Creating new user', { username: req.body.username });

            const hashedPassword = await argon2.hash(req.body.password);
            const user = await User.create({
                ...req.body,
                password: hashedPassword
            });

            logger.info('User created successfully', { userId: user.id });
            return res.status(201).json(user);
        } catch (error) {
            logger.error('User creation failed', {
                error: error.message,
                stack: error.stack,
                username: req.body.username
            });
            return res.status(400).json({ message: 'Failed to create user' });
        }
    };

    /**
     * Create a new SSO user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    createSSOUser = async (req, res) => {
        try {
            logger.info('Creating new SSO user', { username: req.body.username });

            const hashedPassword = await argon2.hash(crypto.randomBytes(32).toString('hex'));
            const user = await User.create({
                ...req.body,
                password: hashedPassword,
                type: 'account',
                host: new URL(process.env.OIDC_ISSUER_URL).hostname
            });

            logger.info('SSO user created successfully', { userId: user.id });
            return res.status(201).json(user);
        } catch (error) {
            logger.error('SSO user creation failed', {
                error: error.message,
                stack: error.stack,
                username: req.body.username
            });
            return res.status(400).json({ message: 'Failed to create SSO user' });
        }
    };

    /**
     * Deactivate a user account
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    deactivateUser = async (req, res) => {
        try {
            logger.info('Attempting to deactivate user', { userId: req.params.id });

            const user = await User.findByPk(req.params.id);
            if (!user) {
                logger.warn('User not found for deactivation', { userId: req.params.id });
                return res.status(404).json({ message: 'User not found' });
            }

            await user.update({ isActive: false });
            logger.info('User deactivated successfully', { userId: user.id });
            return res.json(user);
        } catch (error) {
            logger.error('User deactivation failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id
            });
            return res.status(500).json({ message: 'Failed to deactivate user' });
        }
    };

    /**
     * Delete a user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    delete = async (req, res) => {
        try {
            logger.info('Attempting to delete user', { userId: req.params.id });

            const user = await User.findByPk(req.params.id);
            if (!user) {
                logger.warn('User not found for deletion', { userId: req.params.id });
                return res.status(404).json({ message: 'User not found' });
            }

            await user.destroy();
            logger.info('User deleted successfully', { userId: user.id });
            return res.status(204).send();
        } catch (error) {
            logger.error('User deletion failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id
            });
            return res.status(500).json({ message: 'Failed to delete user' });
        }
    };

    /**
     * Get a single user
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    get = async (req, res) => {
        try {
            logger.info('Retrieving user', { userId: req.params.id });

            const user = await User.findByPk(req.params.id);
            if (!user) {
                logger.warn('User not found', { userId: req.params.id });
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
        } catch (error) {
            logger.error('User retrieval failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id
            });
            return res.status(500).json({ message: 'Failed to get user' });
        }
    };

    /**
     * Get user preferences
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getPreferences = async (req, res) => {
        try {
            logger.info('Retrieving user preferences', { userId: req.user.id });

            const user = await User.findByPk(req.user.id);
            return res.json(user.preferences || {});
        } catch (error) {
            logger.error('Preference retrieval failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user.id
            });
            return res.status(500).json({ message: 'Failed to get preferences' });
        }
    };

    /**
     * Get user profile
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getProfile = async (req, res) => {
        try {
            logger.info('Retrieving user profile', { userId: req.user.id });

            const user = await User.findByPk(req.user.id);
            return res.json(user);
        } catch (error) {
            logger.error('Profile retrieval failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user.id
            });
            return res.status(500).json({ message: 'Failed to get profile' });
        }
    };

    /**
     * Handle SSO callback
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    handleSSOCallback = async (req, res) => {
        try {
            logger.info('Processing SSO callback');

            const params = this.client.callbackParams(req);
            const tokenSet = await this.client.callback(
                process.env.OIDC_REDIRECT_URI,
                params
            );

            const userInfo = await this.client.userinfo(tokenSet.access_token);
            let user = await User.findOne({ where: { email: userInfo.email } });

            if (!user) {
                user = await User.create({
                    username: userInfo.preferred_username || userInfo.email,
                    email: userInfo.email,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    isActive: true,
                    type: 'account',
                    password: crypto.randomBytes(32).toString('hex'),
                    host: new URL(process.env.OIDC_ISSUER_URL).hostname,
                    isAdmin: userInfo.groups?.includes('admin') || false
                });

                logger.info('New SSO user created', { userId: user.id });
            } else {
                await user.update({
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    isAdmin: userInfo.groups?.includes('admin') || user.isAdmin
                });

                logger.info('Existing SSO user updated', { userId: user.id });
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            return res.json({ accessToken, refreshToken });
        } catch (error) {
            logger.error('SSO callback failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ message: 'SSO authentication failed' });
        }
    };

    /**
     * List all users
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    list = async (req, res) => {
        try {
            logger.info('Listing all users');

            const users = await User.findAll();
            logger.info('Users retrieved successfully', { count: users.length });
            return res.json(users);
        } catch (error) {
            logger.error('User listing failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ message: 'Failed to list users' });
        }
    };

    /**
     * List all employees
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    listEmployees = async (req, res) => {
        try {
            logger.info('Listing all employees');

            const employees = await User.findAll({
                where: { type: 'roster' }
            });

            logger.info('Employees retrieved successfully', { count: employees.length });
            return res.json(employees);
        } catch (error) {
            logger.error('Employee listing failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ message: 'Failed to list employees' });
        }
    };

    /**
     * Request a password reset
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    requestPasswordReset = async (req, res) => {
        try {
            logger.info('Password reset requested', { email: req.body.email });

            const user = await User.findOne({
                where: { email: req.body.email }
            });

            if (!user) {
                logger.warn('User not found for password reset', { email: req.body.email });
                return res.status(404).json({ message: 'User not found' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            await user.update({
                resetToken: token,
                resetTokenExpires: Date.now() + 3600000 // 1 hour
            });

            // TODO: Send email with reset token
            logger.info('Password reset token generated', { userId: user.id });
            return res.json({ message: 'Password reset email sent' });
        } catch (error) {
            logger.error('Password reset request failed', {
                error: error.message,
                stack: error.stack,
                email: req.body.email
            });
            return res.status(500).json({ message: 'Failed to request password reset' });
        }
    };

    /**
     * Reset password using token
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    resetPassword = async (req, res) => {
        try {
            logger.info('Attempting password reset', { token: req.params.token });

            const user = await User.findOne({
                where: {
                    resetToken: req.params.token,
                    resetTokenExpires: { [Op.gt]: Date.now() }
                }
            });

            if (!user) {
                logger.warn('Invalid or expired reset token', { token: req.params.token });
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            const hashedPassword = await argon2.hash(req.body.password);
            await user.update({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            });

            logger.info('Password reset completed', { userId: user.id });
            return res.json({ message: 'Password reset successful' });
        } catch (error) {
            logger.error('Password reset failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ message: 'Failed to reset password' });
        }
    };

    /**
     * Sync SSO user data
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    syncSSOUser = async (req, res) => {
        try {
            logger.info('Syncing SSO user', { userId: req.params.id });

            const user = await User.findByPk(req.params.id);
            if (!user || !user.host) {
                logger.warn('SSO user not found', { userId: req.params.id });
                return res.status(404).json({ message: 'SSO user not found' });
            }

            // TODO: Add OIDC provider sync logic here
            await user.update({
                ...req.body,
                lastSynced: new Date()
            });

            logger.info('SSO user synced successfully', { userId: user.id });
            return res.json(user);
        } catch (error) {
            logger.error('SSO user sync failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id
            });
            return res.status(500).json({ message: 'Failed to sync SSO user' });
        }
    };
    /**
         * Update a user
         * @param {Request} req - Express request object
         * @param {Response} res - Express response object
         */
    update = async (req, res) => {
        try {
            logger.info('Attempting to update user', {
                userId: req.params.id,
                updates: req.body
            });

            const user = await User.findByPk(req.params.id);
            if (!user) {
                logger.warn('User not found for update', { userId: req.params.id });
                return res.status(404).json({ message: 'User not found' });
            }

            await user.update(req.body);
            logger.info('User updated successfully', { userId: user.id });
            return res.json(user);
        } catch (error) {
            logger.error('User update failed', {
                error: error.message,
                stack: error.stack,
                userId: req.params.id,
                updates: req.body
            });
            return res.status(400).json({ message: 'Failed to update user' });
        }
    };

    /**
     * Update user password
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    updatePassword = async (req, res) => {
        try {
            logger.info('Attempting password update', { userId: req.user.id });

            const user = await User.findByPk(req.user.id);
            const validPassword = await argon2.verify(
                user.password,
                req.body.currentPassword
            );

            if (!validPassword) {
                logger.warn('Invalid current password provided', { userId: user.id });
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            const hashedPassword = await argon2.hash(req.body.newPassword);
            await user.update({ password: hashedPassword });

            logger.info('Password updated successfully', { userId: user.id });
            return res.json({ message: 'Password updated successfully' });
        } catch (error) {
            logger.error('Password update failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user.id
            });
            return res.status(500).json({ message: 'Failed to update password' });
        }
    };

    /**
     * Update user preferences
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    updatePreferences = async (req, res) => {
        try {
            logger.info('Updating user preferences', {
                userId: req.user.id,
                preferences: req.body
            });

            const user = await User.findByPk(req.user.id);
            await user.update({ preferences: req.body });

            logger.info('Preferences updated successfully', { userId: user.id });
            return res.json(user.preferences);
        } catch (error) {
            logger.error('Preference update failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user.id,
                preferences: req.body
            });
            return res.status(500).json({ message: 'Failed to update preferences' });
        }
    };

    /**
     * Update user profile
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    updateProfile = async (req, res) => {
        try {
            logger.info('Updating user profile', {
                userId: req.user.id,
                updates: req.body
            });

            const user = await User.findByPk(req.user.id);
            await user.update(req.body);

            logger.info('Profile updated successfully', { userId: user.id });
            return res.json(user);
        } catch (error) {
            logger.error('Profile update failed', {
                error: error.message,
                stack: error.stack,
                userId: req.user.id,
                updates: req.body
            });
            return res.status(400).json({ message: 'Failed to update profile' });
        }
    };
}

export { UserController };
export default UserController;