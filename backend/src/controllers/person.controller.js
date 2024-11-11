const { Person, Event, Timecard } = require('../models');
const { Op } = require('sequelize');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

/**
 * Controller handling person-related operations
 */
class PersonController {
    /**
     * Bulk create multiple persons
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    bulkCreate = async (req, res) => {
        try {
            logger.info('Bulk creating persons', { count: req.body.length });
            
            const persons = await Person.bulkCreate(req.body, {
                validate: true
            });
            
            logger.info('Persons bulk created successfully', { count: persons.length });
            return res.status(201).json(persons);
        } catch (error) {
            logger.error('Person bulk creation failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(400).json({ 
                message: 'Failed to bulk create persons',
                error: error.message 
            });
        }
    };

    /**
     * Bulk update multiple persons
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    bulkUpdate = async (req, res) => {
        try {
            logger.info('Bulk updating persons', { updates: req.body });
            
            const results = await Promise.all(
                req.body.map(({ id, ...data }) => 
                    Person.update(data, { where: { id } })
                )
            );
            
            logger.info('Persons bulk updated successfully', { count: results.length });
            return res.json({ message: 'Persons updated successfully' });
        } catch (error) {
            logger.error('Person bulk update failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(400).json({ 
                message: 'Failed to bulk update persons',
                error: error.message 
            });
        }
    };

    /**
     * Create a new person
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    create = async (req, res) => {
        try {
            logger.info('Creating new person', { data: req.body });
            
            const person = await Person.create({
                ...req.body,
                addedBy: req.user.username
            });
            
            logger.info('Person created successfully', { personId: person.id });
            return res.status(201).json(person);
        } catch (error) {
            logger.error('Person creation failed', {
                error: error.message,
                stack: error.stack,
                data: req.body
            });
            return res.status(400).json({ 
                message: 'Failed to create person',
                error: error.message 
            });
        }
    };

    /**
     * Delete a person
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    delete = async (req, res) => {
        try {
            logger.info('Deleting person', { personId: req.params.id });
            
            const person = await Person.findByPk(req.params.id);
            if (!person) {
                logger.warn('Person not found for deletion', { personId: req.params.id });
                return res.status(404).json({ message: 'Person not found' });
            }

            await person.destroy();
            logger.info('Person deleted successfully', { personId: req.params.id });
            return res.status(204).send();
        } catch (error) {
            logger.error('Person deletion failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to delete person',
                error: error.message 
            });
        }
    };

    /**
     * Get a single person
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    get = async (req, res) => {
        try {
            logger.info('Retrieving person', { personId: req.params.id });
            
            const person = await Person.findByPk(req.params.id);
            if (!person) {
                logger.warn('Person not found', { personId: req.params.id });
                return res.status(404).json({ message: 'Person not found' });
            }
            
            logger.info('Person retrieved successfully', { personId: person.id });
            return res.json(person);
        } catch (error) {
            logger.error('Person retrieval failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to get person',
                error: error.message 
            });
        }
    };

    /**
     * Get person's availability
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getAvailability = async (req, res) => {
        try {
            logger.info('Retrieving person availability', { 
                personId: req.params.id,
                dateRange: req.query 
            });
            
            const { startDate, endDate } = req.query;
            const events = await Event.findAll({
                where: {
                    personId: req.params.id,
                    dateStart: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                }
            });
            
            logger.info('Availability retrieved successfully', { 
                personId: req.params.id,
                eventCount: events.length 
            });
            return res.json(events);
        } catch (error) {
            logger.error('Availability retrieval failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to get availability',
                error: error.message 
            });
        }
    };

    /**
     * Get person's events
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getEvents = async (req, res) => {
        try {
            logger.info('Retrieving person events', { personId: req.params.id });
            
            const events = await Event.findAll({
                where: { personId: req.params.id },
                order: [['dateStart', 'ASC']]
            });
            
            logger.info('Events retrieved successfully', { 
                personId: req.params.id,
                eventCount: events.length 
            });
            return res.json(events);
        } catch (error) {
            logger.error('Events retrieval failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to get events',
                error: error.message 
            });
        }
    };

    /**
     * Get person's schedule
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getSchedule = async (req, res) => {
        try {
            logger.info('Retrieving person schedule', { personId: req.params.id });
            
            const schedule = await Event.findAll({
                where: {
                    personId: req.params.id,
                    dateStart: {
                        [Op.gte]: new Date()
                    }
                },
                order: [['dateStart', 'ASC']]
            });
            
            logger.info('Schedule retrieved successfully', { 
                personId: req.params.id,
                eventCount: schedule.length 
            });
            return res.json(schedule);
        } catch (error) {
            logger.error('Schedule retrieval failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to get schedule',
                error: error.message 
            });
        }
    };

    /**
     * List all persons
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    list = async (req, res) => {
        try {
            logger.info('Listing persons');
            
            const persons = await Person.findAll({
                order: [['lastName', 'ASC'], ['firstName', 'ASC']]
            });
            
            logger.info('Persons listed successfully', { count: persons.length });
            return res.json(persons);
        } catch (error) {
            logger.error('Person listing failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ 
                message: 'Failed to list persons',
                error: error.message 
            });
        }
    };

    /**
     * Search persons
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    search = async (req, res) => {
        try {
            const { q } = req.query;
            logger.info('Searching persons', { query: q });

            const persons = await Person.findAll({
                where: {
                    [Op.or]: [
                        { firstName: { [Op.iLike]: `%${q}%` } },
                        { lastName: { [Op.iLike]: `%${q}%` } },
                        { email: { [Op.iLike]: `%${q}%` } }
                    ]
                }
            });
            
            logger.info('Person search completed', { 
                query: q,
                resultCount: persons.length 
            });
            return res.json(persons);
        } catch (error) {
            logger.error('Person search failed', {
                error: error.message,
                stack: error.stack,
                query: req.query
            });
            return res.status(500).json({ 
                message: 'Failed to search persons',
                error: error.message 
            });
        }
    };

    /**
     * Update a person
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    update = async (req, res) => {
        try {
            logger.info('Updating person', { 
                personId: req.params.id,
                updates: req.body 
            });
            
            const person = await Person.findByPk(req.params.id);
            if (!person) {
                logger.warn('Person not found for update', { personId: req.params.id });
                return res.status(404).json({ message: 'Person not found' });
            }

            await person.update(req.body);
            logger.info('Person updated successfully', { personId: person.id });
            return res.json(person);
        } catch (error) {
            logger.error('Person update failed', {
                error: error.message,
                stack: error.stack,
                personId: req.params.id,
                updates: req.body
            });
            return res.status(400).json({ 
                message: 'Failed to update person',
                error: error.message 
            });
        }
    };
}

module.exports = new PersonController();