const { Sequelize } = require('sequelize');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

const createConnection = async (config) => {
    let sequelize;

    if (config.type === 'sqlite') {
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: `${config.database}.sqlite`,
            logging: (msg) => logger.debug(msg),
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
    } else {
        sequelize = new Sequelize(
            config.database,
            config.username,
            config.password,
            {
                host: config.host,
                port: config.port,
                dialect: 'postgres',
                logging: (msg) => logger.debug(msg),
                ssl: config.ssl,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                dialectOptions: config.ssl ? {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                } : {}
            }
        );
    }

    // Test connection
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully');
        return sequelize;
    } catch (error) {
        logger.error(`Unable to connect to database: ${error.message}`);
        throw error;
    }
};

const initializeModels = async (sequelize) => {
    const models = require('../models');
    
    // First initialize all models
    Object.values(models).forEach(model => {
        if (typeof model.init === 'function') {
            model.init(sequelize);
        }
    });

    // Then set up associations after all models are initialized
    setTimeout(() => {
        Object.values(models).forEach(model => {
            if (typeof model.associate === 'function') {
                model.associate(models);
            }
        });
    }, 0);

    return models;
};

module.exports = {
    createConnection,
    initializeModels
};