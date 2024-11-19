import { Sequelize } from 'sequelize';
import Logger from '../core/Logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { importModels } from '../models/index.js';
import pkg from 'glob';
const { glob } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = Logger.getInstance();

export const createConnection = async (config) => {
    const baseConfig = {
        benchmark: true,
        logQueryParameters: true,
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };

    let sequelize;

    try {
        if (config.type === 'sqlite') {
            sequelize = new Sequelize({
                ...baseConfig,
                dialect: 'sqlite',
                storage: `${config.database}.sqlite`
            });
        } else {
            sequelize = new Sequelize(
                config.database,
                config.username,
                config.password,
                {
                    ...baseConfig,
                    host: config.host,
                    port: config.port,
                    dialect: 'postgres',
                    ssl: config.ssl,
                    dialectOptions: config.ssl ? {
                        ssl: {
                            require: true,
                            rejectUnauthorized: false
                    }
                } : {}
            });
        }

        await sequelize.authenticate();
        logger.info('Database connection established');

        return sequelize;
    } catch (error) {
        logger.error('Database connection failed:', {
            error: error.message,
            stack: error.stack,
            dialect: config.type
        });
        throw error;
    }
};

export const initializeModels = async (sequelize) => {
    try {
        const models = await importModels();
        
        // Initialize models
        for (const model of Object.values(models)) {
            if (typeof model.init === 'function') {
                model.init(sequelize);
                logger.debug(`Initialized model: ${model.name}`);
            }
        }

        // Set up associations
        for (const model of Object.values(models)) {
            if (typeof model.associate === 'function') {
                model.associate(models);
                logger.debug(`Associated model: ${model.name}`);
            }
        }

        return models;
    } catch (error) {
        logger.error('Model initialization failed:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
