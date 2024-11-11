import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

class Logger {
    static #instance;
    #logger;
    #config;

    constructor(config = null) {
        if (Logger.#instance) {
            return Logger.#instance;
        }

        // Start with test/basic configuration
        this.#initializeBasicLogger();
        
        // If config is provided, set up production logger
        if (config) {
            this.configure(config);
        }
        
        Logger.#instance = this;
    }

    #initializeBasicLogger() {
        this.#logger = winston.createLogger({
            level: 'error',
            format: winston.format.simple(),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    configure(config) {
        // Don't reconfigure if we're in test environment
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const customFormat = winston.format.printf(({ timestamp, level, message, metadata = {} }) => {
            const ts = new Date(timestamp).toLocaleTimeString('en-US', { hour12: false });
            const meta = Object.keys(metadata).length ? 
                `\n  ${JSON.stringify(metadata, null, 2).replace(/\n/g, '\n  ')}` : '';
            
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
                })
            ]
        });

        // Only add file transport if directory is configured
        if (config.directory) {
            this.#logger.add(new DailyRotateFile({
                dirname: config.directory,
                filename: 'app-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                maxFiles: config.maxFiles,
                format: winston.format.json()
            }));
        }

        this.#config = config;
    }

    static getInstance() {
        if (!Logger.#instance) {
            // Create instance with basic/test logging
            new Logger();
        }
        return Logger.#instance;
    }

    static initialize(config) {
        const instance = Logger.getInstance();
        instance.configure(config);
        return instance;
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

    get stream() {
        return {
            write: (message) => {
                this.info(message.trim());
            }
        };
    }
}

// Export both the class and default instance
export { Logger };
export default Logger;