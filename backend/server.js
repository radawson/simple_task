const path = require('path');
require('dotenv').config();

// Load config and initialize logger
const config = require('./src/config');
const Logger = require('./src/core/Logger');
const logger = new Logger(config.logger);  // Initialize first
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

// PM2 specific signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // PM2 restart

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}`, { reason });
  process.exit(1);
});

// Start application
const startServer = require('./src');
startServer().then(app => {
  server = app;  // Store server instance
}).catch(error => {
  logger.error(`Fatal error during startup: ${error.message}`);
  process.exit(1);
});