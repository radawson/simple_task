const { Task, Template, User } = require('../models');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

class TaskController {
    async list(req, res) {
        try {
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
                    through: { attributes: [] }
                }]
            });

            logger.info(`Retrieved ${tasks.count} tasks`);
            return res.json({
                tasks: tasks.rows,
                total: tasks.count,
                page: parseInt(page),
                totalPages: Math.ceil(tasks.count / limit)
            });

        } catch (error) {
            logger.error(`Task listing failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to list tasks',
                error: error.message 
            });
        }
    }

    async create(req, res) {
        try {
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

            logger.info(`Task created: ${task.id}`);
            return res.status(201).json(task);

        } catch (error) {
            logger.error(`Task creation failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to create task',
                error: error.message 
            });
        }
    }

    async get(req, res) {
        try {
            const task = await Task.findByPk(req.params.id, {
                include: [{
                    model: Template,
                    through: { attributes: [] }
                }]
            });

            if (!task) {
                logger.warn(`Task not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Task not found' });
            }

            return res.json(task);

        } catch (error) {
            logger.error(`Task retrieval failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get task',
                error: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const task = await Task.findByPk(req.params.id);
            if (!task) {
                logger.warn(`Task not found for update: ${req.params.id}`);
                return res.status(404).json({ message: 'Task not found' });
            }

            await task.update(req.body);

            if (req.body.templateIds) {
                const templates = await Template.findAll({
                    where: { id: req.body.templateIds }
                });
                await task.setTemplates(templates);
            }

            logger.info(`Task updated: ${task.id}`);
            return res.json(task);

        } catch (error) {
            logger.error(`Task update failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to update task',
                error: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const task = await Task.findByPk(req.params.id);
            if (!task) {
                logger.warn(`Task not found for deletion: ${req.params.id}`);
                return res.status(404).json({ message: 'Task not found' });
            }

            await task.destroy();
            logger.info(`Task deleted: ${task.id}`);
            return res.status(204).send();

        } catch (error) {
            logger.error(`Task deletion failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to delete task',
                error: error.message 
            });
        }
    }
}

module.exports = new TaskController();