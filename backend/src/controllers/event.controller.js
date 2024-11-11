import { Event, Person } from '../models/index.js';
import { Op } from 'sequelize';
import Logger from '../core/Logger.js';
const logger = Logger.getInstance();

/**
 * Controller handling event-related operations
 */
class EventController {
    constructor(socketService) {
        this.socketService = socketService;
    }

    /**
     * Create a new event
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    create = async (req, res) => {
        try {
            logger.info('Creating new event', { user: req.user.username });
            
            const event = await Event.create({
                ...req.body,
                addedBy: req.user.username
            });
            
            logger.info('Event created successfully', { eventId: event.id });
            
            // Notify subscribers
            this.notifySubscribers(event, 'create');
            
            return res.status(201).json(event);
        } catch (error) {
            logger.error('Event creation failed', { 
                error: error.message,
                stack: error.stack,
                userData: req.body 
            });
            return res.status(400).json({ 
                message: 'Failed to create event',
                error: error.message 
            });
        }
    };

    /**
     * Delete an event
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    delete = async (req, res) => {
        try {
            logger.info('Attempting to delete event', { eventId: req.params.id });
            
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn('Event not found for deletion', { eventId: req.params.id });
                return res.status(404).json({ message: 'Event not found' });
            }

            // Store date before deletion
            const eventDate = event.dtstart;
            
            await event.destroy();
            
            logger.info('Event deleted successfully', { eventId: req.params.id });
            
            // Notify subscribers
            this.notifySubscribers({ id: req.params.id, dtstart: eventDate }, 'delete');
            
            return res.status(204).send();
        } catch (error) {
            logger.error('Event deletion failed', {
                error: error.message,
                stack: error.stack,
                eventId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to delete event',
                error: error.message 
            });
        }
    };

    /**
     * Export event to iCal format
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    exportICal = async (req, res) => {
        try {
            logger.info('Attempting to export event to iCal', { eventId: req.params.id });

            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn('Event not found for iCal export', { eventId: req.params.id });
                return res.status(404).json({ message: 'Event not found' });
            }

            const icalData = event.toICalEvent();
            res.setHeader('Content-Type', 'text/calendar');
            res.setHeader('Content-Disposition', `attachment; filename=${event.uid}.ics`);

            logger.info('Event exported to iCal successfully', { eventId: event.id });
            return res.send(icalData);
        } catch (error) {
            logger.error('iCal export failed', {
                error: error.message,
                stack: error.stack,
                eventId: req.params.id
            });
            return res.status(500).json({
                message: 'Failed to export event',
                error: error.message
            });
        }
    };

    /**
     * Retrieve a single event by ID
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    get = async (req, res) => {
        try {
            logger.info('Retrieving event', { eventId: req.params.id });

            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn('Event not found', { eventId: req.params.id });
                return res.status(404).json({ message: 'Event not found' });
            }

            logger.info('Event retrieved successfully', { eventId: event.id });
            return res.json(event);
        } catch (error) {
            logger.error('Event retrieval failed', {
                error: error.message,
                stack: error.stack,
                eventId: req.params.id
            });
            return res.status(500).json({
                message: 'Failed to get event',
                error: error.message
            });
        }
    };

    /**
         * Retrieve events for a specific date
         * @param {Request} req - Express request object
         * @param {Response} res - Express response object
         */
    getByDate = async (req, res) => {
        try {
            const { date } = req.params;
            logger.info('Retrieving events by date', { date });

            // Validate date format
            const parsedDate = new Date(date);
            if (!date || isNaN(parsedDate.getTime())) {
                logger.warn('Invalid date format provided', { date });
                return res.status(400).json({
                    message: 'Invalid date format. Expected YYYY-MM-DD'
                });
            }

            const events = await Event.findAll({
                where: {
                    dtstart: date  // Using your DATEONLY field
                },
                include: [{
                    model: Person,
                    attributes: ['id', 'firstName', 'lastName']
                }],
                order: [
                    ['timeStart', 'ASC'],  // Order by time if available
                    ['dtstart', 'ASC'],    // Then by date
                    ['priority', 'DESC']    // High priority items first
                ]
            });

            logger.info('Events retrieved successfully', {
                date,
                count: events.length
            });

            return res.status(200).json(events);

        } catch (error) {
            logger.error('Failed to get events by date', {
                error: error.message,
                stack: error.stack,
                date: req.params.date
            });
            return res.status(500).json({
                message: 'Failed to retrieve events',
                error: error.message
            });
        }
    };

    /**
     * Retrieve events within a date range
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getByDateRange = async (req, res) => {
        try {
            const { start, end } = req.params;
            logger.info('Retrieving events by date range', { start, end });

            // Validate dates
            if (!start || !end || isNaN(new Date(start).getTime()) || isNaN(new Date(end).getTime())) {
                logger.warn('Invalid date format in range', { start, end });
                return res.status(400).json({
                    message: 'Invalid date format. Expected YYYY-MM-DD'
                });
            }

            const events = await Event.findAll({
                where: {
                    dtstart: {
                        [Op.between]: [start, end]
                    }
                },
                include: [{
                    model: Person,
                    attributes: ['id', 'firstName', 'lastName']
                }],
                order: [
                    ['dtstart', 'ASC'],
                    ['timeStart', 'ASC'],
                    ['priority', 'DESC']
                ]
            });

            logger.info('Events retrieved by date range successfully', {
                start,
                end,
                count: events.length
            });
            return res.json(events);
        } catch (error) {
            logger.error('Event range query failed', {
                error: error.message,
                stack: error.stack,
                dateRange: req.params
            });
            return res.status(500).json({
                message: 'Failed to get events by range',
                error: error.message
            });
        }
    };


    /**
     * Import event from iCal format
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    importICal = async (req, res) => {
        try {
            logger.info('Attempting to import event from iCal', { user: req.user.username });

            const { icalData } = req.body;
            const eventData = Event.fromICalEvent(icalData);
            const event = await Event.create({
                ...eventData,
                addedBy: req.user.username
            });

            logger.info('Event imported successfully', { eventId: event.id });
            return res.status(201).json(event);
        } catch (error) {
            logger.error('iCal import failed', {
                error: error.message,
                stack: error.stack,
                user: req.user.username
            });
            return res.status(500).json({
                message: 'Failed to import event',
                error: error.message
            });
        }
    };

    /**
     * List events with pagination
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    list = async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            logger.info('Listing events', { page, limit });

            const events = await Event.findAndCountAll({
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [['dateStart', 'ASC']]
            });

            const response = {
                events: events.rows,
                total: events.count,
                page: parseInt(page),
                totalPages: Math.ceil(events.count / limit)
            };

            logger.info('Events listed successfully', {
                total: events.count,
                page,
                limit
            });
            return res.json(response);
        } catch (error) {
            logger.error('Event listing failed', {
                error: error.message,
                stack: error.stack,
                query: req.query
            });
            return res.status(500).json({
                message: 'Failed to list events',
                error: error.message
            });
        }
    };

    /**
     * Notify subscribers of event changes
     * @private
     * @param {Event} event - The event that changed
     * @param {string} action - The type of change (create/update/delete)
     */
    notifySubscribers(event, action) {
        if (!this.socketService) return;

        const date = event.dtstart;
        const formattedDate = new Date(date).toISOString().split('T')[0];

        // Notify specific date room
        this.socketService.notifyEventUpdate(formattedDate, {
            action,
            event: action === 'delete' ? { id: event.id } : event
        });
    }


    /**
     * Update an existing event
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    update = async (req, res) => {
        try {
            logger.info('Attempting to update event', { 
                eventId: req.params.id,
                updates: req.body 
            });
            
            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn('Event not found for update', { eventId: req.params.id });
                return res.status(404).json({ message: 'Event not found' });
            }

            const oldDate = event.dtstart;
            await event.update(req.body);
            
            logger.info('Event updated successfully', { eventId: event.id });

            // If date changed, notify both old and new date subscribers
            if (oldDate !== event.dtstart) {
                const oldFormattedDate = new Date(oldDate).toISOString().split('T')[0];
                this.socketService.notifyEventUpdate(oldFormattedDate, {
                    action: 'delete',
                    event: { id: event.id }
                });
            }
            
            this.notifySubscribers(event, 'update');
            
            return res.json(event);
        } catch (error) {
            logger.error('Event update failed', {
                error: error.message,
                stack: error.stack,
                eventId: req.params.id,
                updates: req.body
            });
            return res.status(400).json({ 
                message: 'Failed to update event',
                error: error.message 
            });
        }
    };
}

export default EventController;