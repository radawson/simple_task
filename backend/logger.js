const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('./config'); 
// Set up log directory
const logDir = path.join(__dirname, 'logs');

// Create a custom timestamp format
const customFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Define the logger configuration using the log level from config.js
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',  // Use LOG_LEVEL from configuration
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),  // Capture stack trace on errors
    winston.format.splat(),                  // Support string interpolation
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),  // Colorize the output in the console
        customFormat
      ),
    }),
    // Add daily rotation for log files
    new DailyRotateFile({
      dirname: logDir,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',  // Keep logs for 14 days
      format: winston.format.json(),  // Use JSON format for file logs
    }),
  ],
});

// Add a stream method for integrating with morgan (HTTP request logging)
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
