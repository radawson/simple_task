// src/middleware/validation.js
const Joi = require('joi');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

// Base schemas
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$')),
    email: Joi.string().email(),
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    isAdmin: Joi.boolean()
});

const taskSchema = Joi.object({
    name: Joi.string().required().max(200),
    description: Joi.string(),
    completed: Joi.boolean(),
    priority: Joi.number().min(0).max(5),
    date: Joi.date(),
    template: Joi.boolean(),
    addedBy: Joi.string()
});

const eventSchema = Joi.object({
    summary: Joi.string().required().max(200),
    description: Joi.string(),
    dtstart: Joi.date().required(),
    dtend: Joi.date().min(Joi.ref('dtstart')),
    location: Joi.string(),
    participants: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ),
    status: Joi.string().valid('CONFIRMED', 'TENTATIVE', 'CANCELLED'),
    priority: Joi.number().min(0).max(9)
});

const fileSchema = Joi.object({
    filename: Joi.string().required(),
    metadata: Joi.object({
        sender: Joi.string().required(),
        receiver: Joi.string().required()
    }).required()
});

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            logger.warn(`Validation error: ${error.message}`);
            return res.status(400).json({
                message: 'Validation error',
                details: error.details.map(detail => ({
                    message: detail.message,
                    path: detail.path
                }))
            });
        }
        next();
    };
};

// Export validation middlewares
module.exports = {
    validateLogin: validate(loginSchema),
    validateUser: validate(userSchema),
    validateTask: validate(taskSchema),
    validateEvent: validate(eventSchema),
    validateFile: validate(fileSchema),
    validateUpdatePassword: validate(Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$')).required(),
        confirmPassword: Joi.ref('newPassword')
    })),
    validateRegistration: validate(userSchema.fork(['password'], (schema) => schema.required())),
    schemas: {
        loginSchema,
        userSchema,
        taskSchema,
        eventSchema
    }
};