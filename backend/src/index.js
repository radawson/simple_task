import dotenv from 'dotenv';
import config from './config/index.js';
import { Database, Logger, Server } from './core/index.js';

async function bootstrap() {
    const logger = Logger.getInstance();
    logger.info('Beginning application bootstrap...');

    try {
        logger.debug('Initializing core services...');
        const db = new Database(config.database);
        const server = new Server(config.server);

        logger.debug('Connecting to database...');
        await db.connect();
        
        logger.debug('Initializing server...');
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
        logger.error(`Bootstrap failed: ${error.message}`, { stack: error.stack });
        process.exit(1);
    }
}

export default bootstrap;