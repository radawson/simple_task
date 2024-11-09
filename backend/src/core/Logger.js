const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

class Logger {
    static #instance;
    #logger;

    constructor(config) {
        if (Logger.#instance) return Logger.#instance;
    
        // Special handling for test environment
        if (process.env.NODE_ENV === 'test') {
            this.#logger = winston.createLogger({
                level: 'error',
                format: winston.format.simple(),
                transports: [
                    new winston.transports.Console({
                        format: winston.format.simple()
                    })
                ]
            });
            Logger.#instance = this;
            return this;
        }
        
        const customFormat = winston.format.printf(({ timestamp, level, message, metadata = {} }) => {
            // Format timestamp for better readability
            const ts = new Date(timestamp).toLocaleTimeString('en-US', { hour12: false });
            
            // Format metadata if present
            const meta = Object.keys(metadata).length ? 
                `\n  ${JSON.stringify(metadata, null, 2).replace(/\n/g, '\n  ')}` : '';
            
            // Format stack traces specially
            if (metadata.stack) {
                return `${ts} [${level.toUpperCase()}] ${message}\n  ${metadata.stack.replace(/\n/g, '\n  ')}`;
            }

            return `${ts} [${level.toUpperCase()}] ${message}${meta}`;
        });

        this.#logger = winston.createLogger({
            level: config.level || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
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
                    dirname: config.directory,
                    filename: 'app-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: config.maxFiles,
                    format: winston.format.json()
                })
            ]
        });

        Logger.#instance = this;
    }

    static getInstance() {
        if (!Logger.#instance) throw new Error('Logger not initialized');
        return Logger.#instance;
    }

    error = (message, meta = {}) => {
        this.#logger.error(message, meta);
    }

    warn = (message, meta = {}) => {
        this.#logger.warn(message, meta);
    }

    info = (message, meta = {}) => {
        this.#logger.info(message, meta);
    }

    debug = (message, meta = {}) => {
        this.#logger.debug(message, meta);
    }
}

module.exports = Logger;