// src/controllers/task.controller.js
const { Task } = require('../models');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

class TaskController {
  async list(req, res) {
    try {
      const { page = 1, limit = 10, completed, priority } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (completed !== undefined) where.completed = completed === 'true';
      if (priority !== undefined) where.priority = priority;

      const tasks = await Task.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      logger.debug(`Retrieved ${tasks.count} tasks`);
      res.json({
        tasks: tasks.rows,
        total: tasks.count,
        page: parseInt(page),
        totalPages: Math.ceil(tasks.count / limit)
      });
    } catch (error) {
      logger.error(`Error fetching tasks: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  async create(req, res) {
    try {
      const task = await Task.create({
        ...req.body,
        added_by: req.user?.username || 'system'
      });
      
      logger.info(`New task created: ${task.id}`);
      res.status(201).json(task);
    } catch (error) {
      logger.error(`Error creating task: ${error.message}`);
      res.status(400).json({ error: 'Failed to create task' });
    }
  }

  async get(req, res) {
    try {
      const task = await Task.findByPk(req.params.id);
      if (!task) {
        logger.warn(`Task not found: ${req.params.id}`);
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      logger.error(`Error fetching task: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }

  async update(req, res) {
    try {
      const task = await Task.findByPk(req.params.id);
      if (!task) {
        logger.warn(`Task not found for update: ${req.params.id}`);
        return res.status(404).json({ error: 'Task not found' });
      }

      await task.update(req.body);
      logger.info(`Task updated: ${task.id}`);
      res.json(task);
    } catch (error) {
      logger.error(`Error updating task: ${error.message}`);
      res.status(400).json({ error: 'Failed to update task' });
    }
  }

  async delete(req, res) {
    try {
      const task = await Task.findByPk(req.params.id);
      if (!task) {
        logger.warn(`Task not found for deletion: ${req.params.id}`);
        return res.status(404).json({ error: 'Task not found' });
      }

      await task.destroy();
      logger.info(`Task deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting task: ${error.message}`);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
}

module.exports = new TaskController();