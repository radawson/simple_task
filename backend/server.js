//server.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import config from './src/config/index.js';
import Logger from './src/core/Logger.js';
import Server from './src/core/Server.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const logger = Logger.initialize(config.logger);
logger.info(`Server process starting with pid: ${process.pid}`);

let server = null;

// Process lifecycle handling
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    if (server?.stop) {
      await server.stop();
      logger.info('Graceful shutdown completed');
    }
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

// Process handlers remain the same
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGUSR2', () => shutdown('SIGUSR2'));

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}`, { reason });
  process.exit(1);
});

// Import and start application
import bootstrap from './src/index.js';
try {
  await bootstrap();
} catch (error) {
  logger.error(`Fatal error during startup: ${error.message}`);
  process.exit(1);
}