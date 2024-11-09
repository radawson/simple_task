const { Notification, User } = require('../models');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

class NotificationController {
    async create(req, res) {
        try {
            const notification = await Notification.create({
                ...req.body,
                expiresAt: req.body.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
                addedBy: req.user.username
            });
            
            logger.info(`Notification created: ${notification.id}`);
            return res.status(201).json(notification);
        } catch (error) {
            logger.error(`Notification creation failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to create notification',
                error: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                logger.warn(`Notification not found for deletion: ${req.params.id}`);
                return res.status(404).json({ message: 'Notification not found' });
            }

            await notification.destroy();
            logger.info(`Notification deleted: ${notification.id}`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`Notification deletion failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to delete notification',
                error: error.message 
            });
        }
    }

    async get(req, res) {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                logger.warn(`Notification not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Notification not found' });
            }
            return res.json(notification);
        } catch (error) {
            logger.error(`Notification retrieval failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get notification',
                error: error.message 
            });
        }
    }

    async getUnread(req, res) {
        try {
            const notifications = await Notification.findAll({
                where: {
                    recipient: req.user.username,
                    read: false,
                    expiresAt: {
                        [Op.gt]: new Date()
                    }
                },
                order: [['priority', 'DESC'], ['createdAt', 'DESC']]
            });
            return res.json(notifications);
        } catch (error) {
            logger.error(`Unread notifications retrieval failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get unread notifications',
                error: error.message 
            });
        }
    }

    async list(req, res) {
        try {
            const { page = 1, limit = 10, type, priority } = req.query;
            
            const where = {
                expiresAt: {
                    [Op.gt]: new Date()
                }
            };
            
            if (type) where.type = type;
            if (priority) where.priority = parseInt(priority);

            const notifications = await Notification.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Retrieved ${notifications.count} notifications`);
            return res.json({
                notifications: notifications.rows,
                total: notifications.count,
                page: parseInt(page),
                totalPages: Math.ceil(notifications.count / limit)
            });
        } catch (error) {
            logger.error(`Notification listing failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to list notifications',
                error: error.message 
            });
        }
    }

    async markAsRead(req, res) {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                logger.warn(`Notification not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Notification not found' });
            }

            await notification.update({ 
                read: true,
                readAt: new Date()
            });
            
            logger.info(`Notification marked as read: ${notification.id}`);
            return res.json(notification);
        } catch (error) {
            logger.error(`Mark as read failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to mark notification as read',
                error: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                logger.warn(`Notification not found for update: ${req.params.id}`);
                return res.status(404).json({ message: 'Notification not found' });
            }

            await notification.update(req.body);
            logger.info(`Notification updated: ${notification.id}`);
            return res.json(notification);
        } catch (error) {
            logger.error(`Notification update failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to update notification',
                error: error.message 
            });
        }
    }
}

module.exports = new NotificationController();