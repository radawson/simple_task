// src/middleware/validation.middleware.js
import Joi from 'joi';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

// Schemas object for better organization
const schemas = {
    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    event: Joi.object({
        summary: Joi.string()
          .required()
          .max(200),
        classification: Joi.string()
          .allow('', null),
        description: Joi.string()
          .allow('', null),
        date_start: Joi.date()
          .required(),
        date_end: Joi.date()
          .min(Joi.ref('date_start'))
          .allow(null),
        time_start: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow('', null),
        time_end: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .allow('', null),
        location: Joi.string()
          .max(200)
          .allow('', null),
        participants: Joi.alternatives()
          .try(
            Joi.string().allow('', null),
            Joi.array().items(Joi.string())
          )
          .default([]),
        status: Joi.string()
          .valid('CONFIRMED', 'TENTATIVE', 'CANCELLED')
          .default('CONFIRMED'),
        organizer: Joi.string()
          .max(50)
          .allow('', null),
        transp: Joi.string()
          .valid('OPAQUE', 'TRANSPARENT')
          .default('OPAQUE'),
        priority: Joi.number()
          .integer()
          .min(0)
          .max(9)
          .default(0),
        url: Joi.string()
          .max(500)
          .uri()
          .allow('', null),
        calendarId: Joi.number()
          .integer()
          .allow(null),
      }).options({
        stripUnknown: true,
        abortEarly: false,
      }),

    note: Joi.object({
        title: Joi.string()
            .required()
            .max(200),
        content: Joi.string()
            .allow('', null),
        date: Joi.date()
            .required()
    }),

    person: Joi.object({
        firstName: Joi.string()
            .required()
            .max(20)
            .trim(),
        lastName: Joi.string()
            .max(20)
            .allow('', null)
            .trim(),
        email: Joi.string()
            .email()
            .allow('', null),
        birthdate: Joi.date()
            .allow(null)
            .iso()
    }).options({ stripUnknown: true }),

    task: Joi.object({
        name: Joi.string()
            .required()
            .max(200),
        description: Joi.string()
            .allow('', null),
        completed: Joi.boolean()
            .default(false),
        priority: Joi.number()
            .integer()
            .min(0)
            .default(0),
        date: Joi.date()
            .iso()
            .required(),
        template: Joi.boolean()
            .default(false),
        templateIds: Joi.array()
            .items(Joi.number().integer())
            .optional()
    }),

    template: Joi.object({
        name: Joi.string()
            .required()
            .max(200),
        description: Joi.string()
            .allow('', null)
    }),

    timecard: Joi.object({
        timeIn: Joi.date()
            .required(),
        timeOut: Joi.date()
            .min(Joi.ref('timeIn')),
        breakStart: Joi.date(),
        breakEnd: Joi.date()
            .min(Joi.ref('breakStart')),
        notes: Joi.string()
            .allow('', null),
        approved: Joi.boolean()
            .default(false)
    }),

    user: Joi.object({
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
    })
};

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

// Create validation middlewares
const validators = {
    validateLogin: validate(schemas.login),
    validateEvent: validate(schemas.event),
    validateFile: validate(schemas.file),
    validateNote: validate(schemas.note),
    validatePassword: validate(schemas.password),
    validatePerson: validate(schemas.person),
    validateTask: validate(schemas.task),
    validateTemplate: validate(schemas.template),
    validateTimecard: validate(schemas.timecard),
    validateUser: validate(schemas.user),
    validateUpdatePassword: validate(Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,30}$')).required(),
        confirmPassword: Joi.ref('newPassword')
    })),
    validateRegistration: validate(schemas.user.fork(['password'], (schema) => schema.required()))
};

// Export everything
export default validators;
export const {
    validateLogin,
    validateEvent,
    validateFile,
    validateNote,
    validatePassword,
    validatePerson,
    validateTask,
    validateTemplate,
    validateTimecard,
    validateUser,
    validateUpdatePassword,
    validateRegistration
} = validators;

// Export schemas separately if needed
export { schemas };