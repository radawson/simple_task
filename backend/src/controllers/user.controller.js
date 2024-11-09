// src/controllers/user.controller.js
const { User } = require('../models');
const Logger = require('../core/Logger');
const argon2 = require('argon2');
const crypto = require('crypto');
const logger = Logger.getInstance();

class UserController {
    activateUser = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            await user.update({ isActive: true });
            logger.info(`User activated: ${user.username}`);
            return res.json(user);
        } catch (error) {
            logger.error(`User activation failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to activate user' });
        }
    }

    create = async (req, res) => {
        try {
            const hashedPassword = await argon2.hash(req.body.password);
            const user = await User.create({
                ...req.body,
                password: hashedPassword
            });
            logger.info(`User created: ${user.username}`);
            return res.status(201).json(user);
        } catch (error) {
            logger.error(`User creation failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to create user' });
        }
    }

    createSSOUser = async (req, res) => {
        try {
            const hashedPassword = await argon2.hash(crypto.randomBytes(32).toString('hex'));
            const user = await User.create({
                ...req.body,
                password: hashedPassword,
                type: 'account',
                host: new URL(process.env.OIDC_ISSUER_URL).hostname
            });
            
            logger.info(`SSO user created: ${user.username}`);
            return res.status(201).json(user);
        } catch (error) {
            logger.error(`SSO user creation failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to create SSO user' });
        }
    }
    
    syncSSOUser = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user || !user.host) {
                return res.status(404).json({ message: 'SSO user not found' });
            }
    
            // TODO: Add OIDC provider sync logic here
            await user.update({
                ...req.body,
                lastSynced: new Date()
            });
    
            logger.info(`SSO user synced: ${user.username}`);
            return res.json(user);
        } catch (error) {
            logger.error(`SSO user sync failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to sync SSO user' });
        }
    }

    deactivateUser = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            await user.update({ isActive: false });
            logger.info(`User deactivated: ${user.username}`);
            return res.json(user);
        } catch (error) {
            logger.error(`User deactivation failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to deactivate user' });
        }
    }

    delete = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            await user.destroy();
            logger.info(`User deleted: ${user.username}`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`User deletion failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to delete user' });
        }
    }

    get = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
        } catch (error) {
            logger.error(`User retrieval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get user' });
        }
    }

    getPreferences = async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);
            return res.json(user.preferences || {});
        } catch (error) {
            logger.error(`Preference retrieval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get preferences' });
        }
    }

    getProfile = async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);
            return res.json(user);
        } catch (error) {
            logger.error(`Profile retrieval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get profile' });
        }
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
                // Create new user from OIDC profile
                user = await User.create({
                    username: userInfo.preferred_username || userInfo.email,
                    email: userInfo.email,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    isActive: true,
                    type: 'account',
                    // Generate random password for SSO users
                    password: crypto.randomBytes(32).toString('hex'),
                    host: new URL(process.env.OIDC_ISSUER_URL).hostname,
                    // Map OIDC groups/roles if available
                    isAdmin: userInfo.groups?.includes('admin') || false
                });

                logger.info(`New SSO user created: ${user.username}`);
            } else {
                // Update existing user with latest OIDC info
                await user.update({
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    isAdmin: userInfo.groups?.includes('admin') || user.isAdmin
                });

                logger.info(`Existing SSO user updated: ${user.username}`);
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            res.json({ accessToken, refreshToken });

        } catch (error) {
            logger.error(`SSO callback failed: ${error.message}`);
            res.status(500).json({ message: 'SSO authentication failed' });
        }
    }

    list = async (req, res) => {
        try {
            const users = await User.findAll();
            return res.json(users);
        } catch (error) {
            logger.error(`User listing failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to list users' });
        }
    }

    listEmployees = async (req, res) => {
        try {
            const employees = await User.findAll({
                where: { type: 'roster' }
            });
            return res.json(employees);
        } catch (error) {
            logger.error(`Employee listing failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to list employees' });
        }
    }

    requestPasswordReset = async (req, res) => {
        try {
            const user = await User.findOne({
                where: { email: req.body.email }
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            await user.update({
                resetToken: token,
                resetTokenExpires: Date.now() + 3600000 // 1 hour
            });

            // TODO: Send email with reset token
            logger.info(`Password reset requested for: ${user.email}`);
            return res.json({ message: 'Password reset email sent' });
        } catch (error) {
            logger.error(`Password reset request failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to request password reset' });
        }
    }

    resetPassword = async (req, res) => {
        try {
            const user = await User.findOne({
                where: {
                    resetToken: req.params.token,
                    resetTokenExpires: { [Op.gt]: Date.now() }
                }
            });

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            const hashedPassword = await argon2.hash(req.body.password);
            await user.update({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            });

            logger.info(`Password reset completed for: ${user.email}`);
            return res.json({ message: 'Password reset successful' });
        } catch (error) {
            logger.error(`Password reset failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to reset password' });
        }
    }

    update = async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            await user.update(req.body);
            logger.info(`User updated: ${user.username}`);
            return res.json(user);
        } catch (error) {
            logger.error(`User update failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to update user' });
        }
    }

    updatePassword = async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);
            const validPassword = await argon2.verify(user.password, req.body.currentPassword);

            if (!validPassword) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            const hashedPassword = await argon2.hash(req.body.newPassword);
            await user.update({ password: hashedPassword });

            logger.info(`Password updated for: ${user.username}`);
            return res.json({ message: 'Password updated successfully' });
        } catch (error) {
            logger.error(`Password update failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to update password' });
        }
    }

    updatePreferences = async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);
            await user.update({ preferences: req.body });
            logger.info(`Preferences updated for: ${user.username}`);
            return res.json(user.preferences);
        } catch (error) {
            logger.error(`Preference update failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to update preferences' });
        }
    }

    updateProfile = async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id);
            await user.update(req.body);
            logger.info(`Profile updated for: ${user.username}`);
            return res.json(user);
        } catch (error) {
            logger.error(`Profile update failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to update profile' });
        }
    }
}

module.exports = new UserController();