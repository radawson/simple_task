import { Event, Person } from '../models/index.js';
import sequelize, { Op } from 'sequelize';
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
            logger.info('Creating new event', {
                user: req.user.username,
                eventData: JSON.stringify(req.body)  // Log full request
            });

            // Extract fields from the request body
            const {
                summary,
                description = null,
                date_start,
                date_end = null,
                time_start = null,
                time_end = null,
                location = null,
                status,
                classification = 'PUBLIC',
                priority = 0,
                url = null,
                organizer = null,
                transp = 'OPAQUE'
            } = req.body;

            // Create DateTime objects
            const startDateTime = time_start
                ? new Date(`${date_start}T${time_start}`)
                : new Date(date_start);

            let endDateTime;
            if (date_end) {
                endDateTime = time_end
                    ? new Date(`${date_end}T${time_end}`)
                    : new Date(date_end);
            } else {
                endDateTime = null;
            }

            // Check if Date objects are valid
            if (isNaN(startDateTime)) {
                throw new Error(`Invalid start date/time: ${date_start} ${time_start}`);
            }
            if (endDateTime && isNaN(endDateTime)) {
                throw new Error(`Invalid end date/time: ${date_end} ${time_end}`);
            }

            const eventData = {
                summary,
                description,
                date_start,
                date_end,
                time_start,
                time_end,
                location,
                status,
                classification,
                priority,
                url,
                organizer,
                participants: Array.isArray(req.body.participants)
                    ? req.body.participants
                    : req.body.participants ? [req.body.participants] : [],
                transp,
                added_by: req.user.username,
            };

            logger.info('Processed event data', {
                processedData: JSON.stringify(eventData)  // Log processed data
            });

            // Create the event
            const event = await Event.create(eventData);

            logger.info('Event created successfully', { eventId: event.id });
            this.notifySubscribers(event, 'create');
            return res.status(201).json(event);
        } catch (error) {
            logger.error('Event creation failed', {
                error: error.message,
                code: error.code,
                name: error.name,
                stack: error.stack,
                userData: JSON.stringify(req.body),
                validationErrors: error.errors?.map(e => ({
                    message: e.message,
                    field: e.path,
                    value: e.value
                }))
            });
            return res.status(400).json({
                message: 'Failed to create event',
                error: error.message,
                details: error.errors?.map(e => e.message)
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
            if (!date) {
                return res.status(400).json({ error: 'Date parameter is required.' });
            }
            logger.info('Retrieving events by date', { date });

            // Get events with organizer details
            const events = await Event.findAll({
                where: {
                    date_start: date
                },
                include: [{
                    model: Person,
                    as: 'organizerUser',  // Use the alias
                    required: false,
                    attributes: ['id', 'firstName', 'lastName']
                }],
                order: [
                    ['time_start', 'ASC'],
                    ['date_start', 'ASC'],
                    ['priority', 'DESC']
                ]
            });

            // Collect all unique participant IDs
            const participantIds = [...new Set(
                events.flatMap(event => event.participants || [])
            )];

            // Fetch participant details if there are any
            let participantMap = new Map();
            if (participantIds.length > 0) {
                const participantDetails = await Person.findAll({
                    where: {
                        id: participantIds
                    },
                    attributes: ['id', 'firstName', 'lastName']
                });

                participantMap = new Map(
                    participantDetails.map(p => [p.id, p])
                );
            }

            // Add participant details to each event
            const eventsWithParticipants = events.map(event => {
                const eventData = event.toJSON();
                eventData.participantDetails = (eventData.participants || [])
                    .map(id => participantMap.get(id))
                    .filter(Boolean);
                return eventData;
            });

            logger.debug('Events retrieved with participants', {
                eventCount: events.length,
                participantIds: participantIds
            });

            return res.json(eventsWithParticipants);
        } catch (error) {
            logger.error('Failed to get events by date', {
                error: error.message,
                stack: error.stack,
                date: date
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
            logger.info('Verifying token payload:', req.user);

            if (!req.user) {
                logger.error('No user information available in request');
                return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
            }

            logger.info('Attempting to update event', {
                eventId: req.params.id,
                updates: req.body
            });

            const event = await Event.findByPk(req.params.id);
            if (!event) {
                logger.warn('Event not found for update', { eventId: req.params.id });
                return res.status(404).json({ message: 'Event not found' });
            }

            // Convert single participant to array if needed
            const updatedData = {
                summary: req.body.summary,
                description: req.body.description || null,
                date_start: new Date(req.body.dtstart).toISOString().split('T')[0],
                date_end: req.body.dtend ? new Date(req.body.dtend).toISOString().split('T')[0] : null,
                time_start: req.body.timeStart || null,
                time_end: req.body.timeEnd || null,
                location: req.body.location,
                participants: Array.isArray(req.body.participants)
                    ? req.body.participants
                    : req.body.participants ? [req.body.participants] : [],
                status: req.body.status,
                classification: req.body.class || 'PUBLIC',
                priority: req.body.priority || 0,
                url: req.body.url || null,
                organizer: req.body.organizer || null,
            };

            const oldDate = event.dtstart;
            await event.update(updatedData);

            logger.info('Event updated successfully', { eventId: event.id });

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