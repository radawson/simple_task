const { Event, User, Person } = require('../models');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

class EventController {
    async create(req, res) {
        try {
            const event = await Event.create({
                ...req.body,
                addedBy: req.user.username
            });
            
            logger.info(`Event created: ${event.id}`);
            return res.status(201).json(event);
        } catch (error) {
            logger.error(`Event creation failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to create event',
                error: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn(`Event not found for deletion: ${req.params.id}`);
                return res.status(404).json({ message: 'Event not found' });
            }

            await event.destroy();
            logger.info(`Event deleted: ${event.id}`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`Event deletion failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to delete event',
                error: error.message 
            });
        }
    }

    async exportICal(req, res) {
        try {
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            const icalData = event.toICalEvent();
            res.setHeader('Content-Type', 'text/calendar');
            res.setHeader('Content-Disposition', `attachment; filename=${event.uid}.ics`);
            return res.send(icalData);
        } catch (error) {
            logger.error(`iCal export failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to export event',
                error: error.message 
            });
        }
    }

    async get(req, res) {
        try {
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn(`Event not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Event not found' });
            }
            return res.json(event);
        } catch (error) {
            logger.error(`Event retrieval failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get event',
                error: error.message 
            });
        }
    }

    async getByDate(req, res) {
        try {
            const { date } = req.params;
            const events = await Event.findAll({
                where: { dateStart: new Date(date) }
            });
            return res.json(events);
        } catch (error) {
            logger.error(`Event date query failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get events by date',
                error: error.message 
            });
        }
    }

    async getByDateRange(req, res) {
        try {
            const { start, end } = req.params;
            const events = await Event.findAll({
                where: {
                    dateStart: {
                        [Op.between]: [new Date(start), new Date(end)]
                    }
                }
            });
            return res.json(events);
        } catch (error) {
            logger.error(`Event range query failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get events by range',
                error: error.message 
            });
        }
    }

    async importICal(req, res) {
        try {
            const { icalData } = req.body;
            const eventData = Event.fromICalEvent(icalData);
            const event = await Event.create({
                ...eventData,
                addedBy: req.user.username
            });
            
            logger.info(`Event imported: ${event.id}`);
            return res.status(201).json(event);
        } catch (error) {
            logger.error(`iCal import failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to import event',
                error: error.message 
            });
        }
    }

    async list(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            
            const events = await Event.findAndCountAll({
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [['dateStart', 'ASC']]
            });

            logger.info(`Retrieved ${events.count} events`);
            return res.json({
                events: events.rows,
                total: events.count,
                page: parseInt(page),
                totalPages: Math.ceil(events.count / limit)
            });
        } catch (error) {
            logger.error(`Event listing failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to list events',
                error: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn(`Event not found for update: ${req.params.id}`);
                return res.status(404).json({ message: 'Event not found' });
            }

            await event.update(req.body);
            logger.info(`Event updated: ${event.id}`);
            return res.json(event);
        } catch (error) {
            logger.error(`Event update failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to update event',
                error: error.message 
            });
        }
    }
}

module.exports = new EventController();