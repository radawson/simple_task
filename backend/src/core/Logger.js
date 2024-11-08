const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class Logger {
  static #instance;
  #logger;
  #config;

  constructor(config) {
    if (Logger.#instance) return Logger.#instance;
    
    this.#validateConfig(config);
    this.#config = config;
    this.#initLogger();
    this.#setupErrorHandlers();
    
    Logger.#instance = this;
  }

  #validateConfig(config) {
    const requiredFields = ['level', 'directory', 'maxFiles'];
    requiredFields.forEach(field => {
      if (!config[field]) throw new Error(`Missing required logger config: ${field}`);
    });
  }

  #initLogger() {
    const customFormat = winston.format.printf(({ timestamp, level, message, stack, metadata }) => {
      const metaStr = metadata && Object.keys(metadata).length ? JSON.stringify(metadata) : '';
      return `${timestamp} [${level.toUpperCase()}] ${stack || message} ${metaStr}`;
    });

    this.#logger = winston.createLogger({
      level: this.#config.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        customFormat
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            customFormat
          )
        }),
        new DailyRotateFile({
          dirname: this.#config.directory,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.#config.maxFiles,
          maxSize: '100m',
          compress: true,
          format: winston.format.json()
        })
      ]
    });

    this.stream = {
      write: (message) => this.info(message.trim())
    };
  }

  #setupErrorHandlers() {
    process.on('uncaughtException', (error) => {
      this.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error(`Unhandled Rejection: ${reason}`, { promise });
    });
  }

  static getInstance() {
    if (!Logger.#instance) throw new Error('Logger not initialized');
    return Logger.#instance;
  }

  error(message, meta = {}) {
    this.#logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.#logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.#logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.#logger.debug(message, meta);
  }

  // Test utility method
  async clearLogs() {
    if (process.env.NODE_ENV === 'test') {
      const fs = require('fs').promises;
      const logFiles = await fs.readdir(this.#config.directory);
      await Promise.all(
        logFiles.map(file => 
          fs.unlink(path.join(this.#config.directory, file))
        )
      );
    }
  }
}

module.exports = Logger;