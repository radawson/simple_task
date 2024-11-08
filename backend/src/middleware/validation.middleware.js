// src/middleware/validation.js
const Joi = require('joi');

const taskSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  completed: Joi.boolean(),
  priority: Joi.number().integer().min(0),
  template: Joi.boolean()
});

const validateTask = async (req, res, next) => {
  try {
    await taskSchema.validateAsync(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.details[0].message });
  }
};

module.exports = { validateTask };