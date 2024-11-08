const Joi = require('joi');

const configSchema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').required(),
  serverUid: Joi.string().required(),
  database: Joi.object({
    type: Joi.string().valid('sqlite', 'postgres').required(),
    host: Joi.string().when('type', { is: 'postgres', then: Joi.required() }),
    port: Joi.number().when('type', { is: 'postgres', then: Joi.required() }),
    database: Joi.string().required(),
    username: Joi.string().when('type', { is: 'postgres', then: Joi.required() }),
    password: Joi.string().when('type', { is: 'postgres', then: Joi.required() }),
    ssl: Joi.boolean()
  }).required(),
  logger: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
    directory: Joi.string().required(),
    maxFiles: Joi.string().required(),
    format: Joi.string().valid('json', 'simple').required()
  }).required(),
  server: Joi.object({
    port: Joi.number().required(),
    sslPort: Joi.number().required(), 
    sslKey: Joi.string().required(),
    sslCert: Joi.string().required(),
    cors: Joi.object({
      origins: Joi.array().items(Joi.string()).required(),
      credentials: Joi.boolean().required()
    }).required()
  }).required()
});

module.exports = configSchema;