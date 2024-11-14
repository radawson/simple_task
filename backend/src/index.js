// src/index.js
import config from './config/index.js';
import { Database, Logger, Server } from './core/index.js';

async function bootstrap() {
    const logger = Logger.getInstance();
    logger.info('Beginning application bootstrap...');

    try {
        logger.debug('Bootstrap config:', {
            serverConfig: !!config.server,
            dbConfig: !!config.database,
            environment: config.env
        });

        logger.debug('Initializing core services...');
        const db = new Database(config.database);
        
        // Set seed flag before connection
        if (config.env === 'development') {
            logger.debug('Development mode - enabling database seeding');
            db.setSeedFlag(true);
        }

        logger.debug('Connecting to database...');
        await db.connect();

        logger.debug('Initializing server...');
        const server = new Server({
            server: config.server,
            security: config.security,
            chat: config.chat,
            cors: config.server.cors
        });
        await server.initialize();

        logger.debug('Starting server...');
        await server.start();

        // Setup graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, initiating graceful shutdown...');
            await server.stop();
            await db.disconnect();
            logger.info('Graceful shutdown complete');
            process.exit(0);
        });

        logger.info('Application bootstrap completed successfully');
        return server;
    } catch (error) {
        logger.error(`Bootstrap failed: ${error.message}`, {
            config: {
                hasServer: !!config.server,
                hasSecurity: !!config.security,
                hasDatabase: !!config.database
            }
        });
        throw error;
    }
}

export default bootstrap;