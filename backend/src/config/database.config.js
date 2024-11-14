//src/config/database.config.js
import { Sequelize } from 'sequelize';
import Logger from '../core/Logger.js';
import { importModels } from '../models/index.js';

const logger = Logger.getInstance();

export const createConnection = async (config) => {
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

    try {
        await sequelize.authenticate();
        logger.info('Database connection established');

        // Add this debug log
        logger.debug('Current models:', {
            models: Object.keys(sequelize.models)
        });

        // Only force sync in development when explicitly requested
        const shouldForceSync = process.env.FORCE_DB_SYNC === 'true' &&
            process.env.NODE_ENV !== 'production';

        if (shouldForceSync) {
            logger.warn('Forcing database sync - all data will be lost');
            await sequelize.sync({ force: true });
            logger.info('Database tables recreated');
        } else {
            // In production, only alter tables if needed
            await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
            logger.info('Database tables synced');
        }

        return sequelize;
    } catch (error) {
        // Enhanced error logging
        logger.error('Database initialization failed:', {
            error: error.message,
            stack: error.stack,
            models: Object.keys(sequelize.models),
            dialect: sequelize.options.dialect
        });
        throw error;
    }
};

export const initializeModels = async (sequelize) => {
    const models = await importModels();

    // First initialize all models
    Object.values(models).forEach(model => {
        if (typeof model.init === 'function') {
            model.init(sequelize);
            logger.debug(`Initialized model: ${model.name}`);
        }
    });

    // Then set up associations
    Object.values(models).forEach(model => {
        if (typeof model.associate === 'function') {
            model.associate(models);
            logger.debug(`Associated model: ${model.name}`);
        }
    });

    logger.info('Syncing database schema...');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('Database schema synchronized');

    return models;
};
