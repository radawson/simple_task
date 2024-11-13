import { Template, Task } from '../models/index.js';
import Logger from '../core/Logger.js';
const logger = Logger.getInstance();

class TemplateController {
    async addTask(req, res) {
        try {
            const { templateId, taskId } = req.body;
            const template = await Template.findByPk(templateId);
            const task = await Task.findByPk(taskId);

            if (!template || !task) {
                return res.status(404).json({ message: 'Template or Task not found' });
            }

            await template.addTask(task);
            logger.info(`Task ${taskId} added to template ${templateId}`);
            res.json({ message: 'Task added to template' });
        } catch (error) {
            logger.error(`Failed to add task to template: ${error.message}`);
            res.status(400).json({ message: 'Failed to add task to template' });
        }
    }

    async create(req, res) {
        try {
            const template = await Template.create({
                ...req.body,
                addedBy: req.user.username
            });
            logger.info(`Template created: ${template.id}`);
            res.status(201).json(template);
        } catch (error) {
            logger.error(`Template creation failed: ${error.message}`);
            res.status(400).json({ message: 'Failed to create template' });
        }
    }

    
    async delete(req, res) {
        try {
            const template = await Template.findByPk(req.params.id);
            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }
            await template.destroy();
            logger.info(`Template deleted: ${template.id}`);
            res.status(204).send();
        } catch (error) {
            logger.error(`Template deletion failed: ${error.message}`);
            res.status(500).json({ message: 'Failed to delete template' });
        }
    }

    async get(req, res) {
        try {
            const template = await Template.findByPk(req.params.id, {
                include: [{
                    model: Task,
                    as: 'tasks' // Match association alias
                }]
            });
            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }
            res.json(template);
        } catch (error) {
            logger.error(`Template retrieval failed: ${error.message}`);
            res.status(500).json({ message: 'Failed to get template' });
        }
    }

    async generateTasks(req, res) {
        try {
            const template = await Template.findByPk(req.params.id, {
                include: [{
                    model: Task,
                    as: 'tasks' // Match association alias
                }]
            });

            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }

            const generatedTasks = await Promise.all(
                template.Tasks.map(async (templateTask) => {
                    return Task.create({
                        name: templateTask.name,
                        description: templateTask.description,
                        priority: templateTask.priority,
                        addedBy: req.user.username,
                        date: req.body.date || new Date(),
                        template: false
                    });
                })
            );

            logger.info(`Generated ${generatedTasks.length} tasks from template ${template.id}`);
            res.json(generatedTasks);
        } catch (error) {
            logger.error(`Task generation failed: ${error.message}`);
            res.status(500).json({ message: 'Failed to generate tasks' });
        }
    }

    async list(req, res) {
        try {
            const templates = await Template.findAll({
                include: [{
                    model: Task,
                    as: 'tasks' // Match association alias
                }]
            });
            logger.info('Templates listed successfully');
            res.json(templates);
        } catch (error) {
            logger.error(`Template listing failed: ${error.message}`);
            res.status(500).json({ message: 'Failed to list templates' });
        }
    }

    async removeTask(req, res) {
        try {
            const template = await Template.findByPk(req.params.id);
            const task = await Task.findByPk(req.params.taskId);

            if (!template) {
                logger.warn(`Template not found for task removal: ${req.params.id}`);
                return res.status(404).json({ message: 'Template not found' });
            }

            if (!task) {
                logger.warn(`Task not found for removal: ${req.params.taskId}`);
                return res.status(404).json({ message: 'Task not found' });
            }

            await template.removeTask(task);
            logger.info(`Task ${req.params.taskId} removed from template ${req.params.id}`);
            res.status(200).json({
                message: 'Task removed from template',
                templateId: template.id,
                taskId: task.id
            });

        } catch (error) {
            logger.error(`Failed to remove task from template: ${error.message}`);
            res.status(500).json({
                message: 'Failed to remove task from template',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const template = await Template.findByPk(req.params.id);
            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }
            await template.update(req.body);
            logger.info(`Template updated: ${template.id}`);
            res.json(template);
        } catch (error) {
            logger.error(`Template update failed: ${error.message}`);
            res.status(400).json({ message: 'Failed to update template' });
        }
    }
}

export { TemplateController };
export default TemplateController;