import { Timecard, User, Person } from '../models/index.js';
import Logger from '../core/Logger.js';
const logger = Logger.getInstance();

class TimecardController {
    async approve(req, res) {
        try {
            const timecard = await Timecard.findByPk(req.params.id);
            if (!timecard) {
                logger.warn(`Timecard not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Timecard not found' });
            }

            if (!req.user.isAdmin) {
                logger.warn(`Unauthorized approval attempt by: ${req.user.username}`);
                return res.status(403).json({ message: 'Not authorized to approve timecards' });
            }

            await timecard.update({
                approved: true,
                approvedBy: req.user.username,
                approvedAt: new Date()
            });

            logger.info(`Timecard approved: ${timecard.id}`);
            return res.json(timecard);
        } catch (error) {
            logger.error(`Timecard approval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to approve timecard' });
        }
    }

    async clockIn(req, res) {
        try {
            const existingOpen = await Timecard.findOne({
                where: {
                    employeeId: req.user.id, 
                    timeOut: null
                }
            });

            if (existingOpen) {
                return res.status(400).json({ message: 'Already clocked in' });
            }

            const timecard = await Timecard.create({
                employeeId: req.user.id,
                timeIn: new Date()
            });

            logger.info(`User clocked in: ${req.user.username}`);
            return res.status(201).json(timecard);
        } catch (error) {
            logger.error(`Clock in failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to clock in' });
        }
    }

    async clockOut(req, res) {
        try {
            const timecard = await Timecard.findOne({
                where: {
                    employeeId: req.user.id,
                    timeOut: null
                }
            });

            if (!timecard) {
                return res.status(400).json({ message: 'No open timecard found' });
            }

            await timecard.update({
                timeOut: new Date()
            });

            logger.info(`User clocked out: ${req.user.username}`);
            return res.json(timecard);
        } catch (error) {
            logger.error(`Clock out failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to clock out' });
        }
    }

    async create(req, res) {
        try {
            if (!req.user.isAdmin && req.body.employeeId !== req.user.id) {
                return res.status(403).json({ message: 'Can only create own timecard' });
            }

            const timecard = await Timecard.create(req.body);
            logger.info(`Timecard created: ${timecard.id}`);
            return res.status(201).json(timecard);
        } catch (error) {
            logger.error(`Timecard creation failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to create timecard' });
        }
    }

    async delete(req, res) {
        try {
            const timecard = await Timecard.findByPk(req.params.id);
            if (!timecard) {
                return res.status(404).json({ message: 'Timecard not found' });
            }

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Not authorized to delete timecards' });
            }

            await timecard.destroy();
            logger.info(`Timecard deleted: ${timecard.id}`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`Timecard deletion failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to delete timecard' });
        }
    }

    async get(req, res) {
        try {
            const timecard = await Timecard.findByPk(req.params.id);
            if (!timecard) {
                return res.status(404).json({ message: 'Timecard not found' });
            }

            if (!req.user.isAdmin && timecard.employeeId !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to view this timecard' });
            }

            return res.json(timecard);
        } catch (error) {
            logger.error(`Timecard retrieval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get timecard' });
        }
    }

    getByEmployee = async (req, res) => {
        try {
            if (!req.user.isAdmin && req.params.employeeId !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to view these timecards' });
            }
    
            const timecards = await Timecard.findAll({
                where: { employeeId: req.params.employeeId },
                order: [['timeIn', 'DESC']]
            });
    
            return res.json(timecards);
        } catch (error) {
            logger.error(`Employee timecard retrieval failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to get employee timecards' });
        }
    }

    async list(req, res) {
        try {
            const { page = 1, limit = 10, startDate, endDate } = req.query;
            const where = {};

            if (!req.user.isAdmin) {
                where.employeeId = req.user.id;
            }

            if (startDate && endDate) {
                where.timeIn = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const timecards = await Timecard.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [['timeIn', 'DESC']]
            });

            logger.info(`Retrieved ${timecards.count} timecards`);
            return res.json({
                timecards: timecards.rows,
                total: timecards.count,
                page: parseInt(page),
                totalPages: Math.ceil(timecards.count / limit)
            });
        } catch (error) {
            logger.error(`Timecard listing failed: ${error.message}`);
            return res.status(500).json({ message: 'Failed to list timecards' });
        }
    }

    async update(req, res) {
        try {
            const timecard = await Timecard.findByPk(req.params.id);
            if (!timecard) {
                return res.status(404).json({ message: 'Timecard not found' });
            }

            if (!req.user.isAdmin && timecard.employeeId !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to update this timecard' });
            }

            if (timecard.approved && !req.user.isAdmin) {
                return res.status(403).json({ message: 'Cannot modify approved timecard' });
            }

            await timecard.update(req.body);
            logger.info(`Timecard updated: ${timecard.id}`);
            return res.json(timecard);
        } catch (error) {
            logger.error(`Timecard update failed: ${error.message}`);
            return res.status(400).json({ message: 'Failed to update timecard' });
        }
    }
}

export { TimecardController };
export default TimecardController;