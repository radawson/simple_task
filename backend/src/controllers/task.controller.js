import { Task, Template } from '../models/index.js';
import { Op } from 'sequelize';
import Logger from '../core/Logger.js';
import { validateTask } from '../middleware/validation.middleware.js';
const logger = Logger.getInstance();

/**
 * Controller handling task-related operations
 */
class TaskController {
    /**
     * Create a new task
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    create = async (req, res) => {
        try {
            logger.info('Creating new task', { 
                user: req.user.username,
                taskData: req.body 
            });

            const task = await Task.create({
                ...req.body,
                addedBy: req.user.username
            });

            if (req.body.templateIds) {
                const templates = await Template.findAll({
                    where: { id: req.body.templateIds }
                });
                await task.setTemplates(templates);
            }

            logger.info('Task created successfully', { taskId: task.id });
            return res.status(201).json(task);

        } catch (error) {
            logger.error('Task creation failed', {
                error: error.message,
                stack: error.stack,
                userData: req.body
            });
            return res.status(400).json({ 
                message: 'Failed to create task',
                error: error.message 
            });
        }
    };

    /**
     * Delete a task
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    delete = async (req, res) => {
        try {
            logger.info('Attempting to delete task', { taskId: req.params.id });

            const task = await Task.findByPk(req.params.id);
            if (!task) {
                logger.warn('Task not found for deletion', { taskId: req.params.id });
                return res.status(404).json({ message: 'Task not found' });
            }

            await task.destroy();
            logger.info('Task deleted successfully', { taskId: req.params.id });
            return res.status(204).send();

        } catch (error) {
            logger.error('Task deletion failed', {
                error: error.message,
                stack: error.stack,
                taskId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to delete task',
                error: error.message 
            });
        }
    };

    /**
     * Get a single task by ID
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    get = async (req, res) => {
        try {
            const task = await Task.findByPk(req.params.id, {
                include: [{
                    model: Template,
                    as: 'templates',
                    through: { attributes: [] }
                }]
            });

            if (!task) {
                logger.warn('Task not found', { taskId: req.params.id });
                return res.status(404).json({ message: 'Task not found' });
            }

            logger.info('Task retrieved successfully', { taskId: task.id });
            return res.json(task);

        } catch (error) {
            logger.error('Task retrieval failed', {
                error: error.message,
                stack: error.stack,
                taskId: req.params.id
            });
            return res.status(500).json({ 
                message: 'Failed to get task',
                error: error.message 
            });
        }
    };

    /**
     * Get tasks by specific date
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    getByDate = async (req, res) => {
        try {
            const { date } = req.params;
            logger.info('Retrieving tasks by date', { date });
    
            const tasks = await Task.findAll({
                where: {
                    date: {
                        [Op.eq]: date  // Use exact date from params
                    }
                },
                include: [{
                    model: Template,
                    as: 'templates',
                    through: { attributes: [] }
                }],
                order: [
                    ['priority', 'DESC'],
                    ['name', 'ASC']
                ]
            });
    
            logger.info('Tasks retrieved by date successfully', { 
                date,
                count: tasks.length 
            });
            
            res.json(tasks);
        } catch (error) {
            logger.error('Failed to get tasks by date:', error);
            res.status(500).json({ message: error.message });
        }
    };

    /**
     * List tasks with pagination and filtering
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    list = async (req, res) => {
        try {
            logger.info('Listing tasks with filters', { query: req.query });
            
            const { 
                page = 1, 
                limit = 10, 
                completed, 
                priority,
                date,
                template 
            } = req.query;
            
            const where = {};
            if (completed !== undefined) where.completed = completed === 'true';
            if (priority !== undefined) where.priority = parseInt(priority);
            if (date) where.date = new Date(date);
            if (template !== undefined) where.template = template === 'true';

            const tasks = await Task.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [
                    ['priority', 'DESC'],
                    ['date', 'ASC']
                ],
                include: [{
                    model: Template,
                    as: 'templates',
                    through: { attributes: [] }
                }]
            });

            logger.info('Tasks retrieved successfully', { 
                count: tasks.count,
                page,
                limit
            });

            return res.json({
                tasks: tasks.rows,
                total: tasks.count,
                page: parseInt(page),
                totalPages: Math.ceil(tasks.count / limit)
            });

        } catch (error) {
            logger.error('Task listing failed', {
                error: error.message,
                stack: error.stack
            });
            return res.status(500).json({ 
                message: 'Failed to list tasks',
                error: error.message 
            });
        }
    };

    /**
     * Update an existing task
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    update = async (req, res) => {
        try {
            const task = await Task.findByPk(req.params.id);
            if (!task) {
                logger.warn('Task not found for update', { taskId: req.params.id });
                return res.status(404).json({ message: 'Task not found' });
            }
    
            // Merge existing task with updates
            const updatedTaskData = {
                ...task.toJSON(),
                ...req.body
            };
    
            // Validate complete task after merge
            try {
                validateTask(updatedTaskData);
            } catch (validationError) {
                return res.status(400).json({ 
                    message: 'Validation error', 
                    error: validationError.message 
                });
            }
    
            await task.update(req.body);
    
            if (req.body.templateIds) {
                const templates = await Template.findAll({
                    where: { id: req.body.templateIds }
                });
                await task.setTemplates(templates);
            }
    
            logger.info('Task updated successfully', { taskId: task.id });
            return res.json(task);
    
        } catch (error) {
            logger.error('Task update failed', {
                error: error.message,
                stack: error.stack,
                taskId: req.params.id,
                updates: req.body
            });
            return res.status(400).json({ 
                message: 'Failed to update task',
                error: error.message 
            });
        }
    };
}

export { TaskController };
export default TaskController;