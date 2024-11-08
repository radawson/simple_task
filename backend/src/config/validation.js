const Joi = require('joi');

const configSchema = Joi.object({
    env: Joi.string().valid('development', 'test', 'production').required(),
    serverUid: Joi.string().required(),
    security: Joi.object({
        rateLimiting: Joi.object({
            windowMs: Joi.number().default(900000),
            max: Joi.number().default(100)
        }).required(),
        helmet: Joi.object({
            contentSecurityPolicy: Joi.object({
                directives: Joi.object({
                    defaultSrc: Joi.array().items(Joi.string()),
                    scriptSrc: Joi.array().items(Joi.string()),
                    styleSrc: Joi.array().items(Joi.string()),
                    imgSrc: Joi.array().items(Joi.string())
                })
            })
        }).required()
    }).required(),
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
    oidc: Joi.object({
        enabled: Joi.boolean().default(false),
        issuerUrl: Joi.string().uri().when('enabled', {
            is: true,
            then: Joi.required()
        }),
        clientId: Joi.string().when('enabled', {
            is: true,
            then: Joi.required()
        }),
        clientSecret: Joi.string().when('enabled', {
            is: true,
            then: Joi.required()
        }),
        redirectUri: Joi.string().uri().when('enabled', {
            is: true,
            then: Joi.required()
        }),
        postLogoutRedirectUri: Joi.string().uri(),
        scope: Joi.string().default('openid profile email'),
        responseType: Joi.string().valid('code').default('code'),
        pkce: Joi.boolean().default(true),
        timeout: Joi.number().default(5000)
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