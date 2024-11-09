// src/middleware/validation.js
const Joi = require('joi');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

// Base schemas
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
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

const noteSchema = Joi.object({
    title: Joi.string()
        .required()
        .max(200)
        .messages({
            'string.empty': 'Title is required',
            'string.max': 'Title cannot be longer than 200 characters'
        }),
    content: Joi.string()
        .allow('', null),
    date: Joi.date()
        .default(Date.now),
    addedBy: Joi.string(),
    tags: Joi.array()
        .items(Joi.string())
        .default([])
});

const passwordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$'))
        .required(),
    confirmPassword: Joi.ref('newPassword')
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

const templateSchema = Joi.object({
    name: Joi.string().required().max(200),
    description: Joi.string(),
    schedule: Joi.string().valid('daily', 'weekly', 'monthly', 'custom'),
    active: Joi.boolean().default(true),
    addedBy: Joi.string()
});

const timecardSchema = Joi.object({
    timeIn: Joi.date()
        .required()
        .messages({
            'date.base': 'Time in must be a valid date',
            'any.required': 'Time in is required'
        }),
    timeOut: Joi.date()
        .min(Joi.ref('timeIn'))
        .messages({
            'date.base': 'Time out must be a valid date',
            'date.min': 'Time out must be after time in'
        }),
    breakStart: Joi.date()
        .min(Joi.ref('timeIn'))
        .messages({
            'date.base': 'Break start must be a valid date',
            'date.min': 'Break start must be after time in'
        }),
    breakEnd: Joi.when('breakStart', {
        is: Joi.exist(),
        then: Joi.date()
            .min(Joi.ref('breakStart'))
            .messages({
                'date.base': 'Break end must be a valid date',
                'date.min': 'Break end must be after break start'
            })
    }),
    notes: Joi.string()
        .allow('', null),
    employeeId: Joi.number()
        .required()
        .messages({
            'any.required': 'Employee ID is required'
        }),
    approved: Joi.boolean()
        .default(false),
    approvedBy: Joi.string()
        .when('approved', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.allow(null)
        }),
    approvedAt: Joi.date()
        .when('approved', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.allow(null)
        })
});

const userSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    email: Joi.string()
        .email()
        .required(),
    firstName: Joi.string()
        .max(50),
    lastName: Joi.string()
        .max(50),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$'))
        .when('host', {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required()
        }),
    isAdmin: Joi.boolean()
        .default(false),
    type: Joi.string()
        .valid('account', 'roster')
        .default('account'),
    host: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .optional(),
    isActive: Joi.boolean()
        .default(true),
    preferences: Joi.object()
        .default({})
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
    validateEvent: validate(eventSchema),
    validateFile: validate(fileSchema),
    validateNote: validate(noteSchema),
    validatePassword: validate(passwordSchema),
    validateUpdatePassword: validate(Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$')).required(),
        confirmPassword: Joi.ref('newPassword')
    })),
    validateRegistration: validate(userSchema.fork(['password'], (schema) => schema.required())),
    schemas: {
        loginSchema,
        passwordSchema,
        userSchema,
        taskSchema,
        eventSchema
    },
    validateTask: validate(taskSchema),
    validateTemplate: validate(templateSchema),
    validateTimecard: validate(timecardSchema),
    validateUser: validate(userSchema),

};