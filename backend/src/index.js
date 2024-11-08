require('dotenv').config();
const config = require('./config');
const { Database, Logger, Server } = require('./core');

async function bootstrap() {
  try {
    const logger = new Logger(config.logger);
    logger.registerErrorHandler();
    const db = new Database(config.database);
    const server = new Server(config.server);

    await db.connect();
    await server.initialize();
    await server.start();

    process.on('SIGTERM', async () => {
      await server.stop();
      await db.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();