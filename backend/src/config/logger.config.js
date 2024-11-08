// src/config/logger.config.js
const path = require('path');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

const config = {
    // Basic settings
    level: process.env.LOG_LEVEL || 'info',
    directory: path.join(process.cwd(), 'logs'),
    maxFiles: process.env.LOG_MAX_FILES || '14d',

    // File settings
    fileConfig: {
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '100m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        compress: true,
        format: 'json'
    },

    // Format settings
    format: {
        timestamp: 'YYYY-MM-DD HH:mm:ss.SSS',
        metadata: {
            includeHostname: true,
            includePid: true,
            includeRequestId: true
        }
    },

    // Console settings
    console: {
        enabled: process.env.NODE_ENV !== 'production',
        level: process.env.LOG_CONSOLE_LEVEL || 'debug',
        colors: logColors
    },

    // Performance settings
    performanceLogging: {
        enabled: process.env.LOG_PERFORMANCE === 'true',
        slowThreshold: parseInt(process.env.LOG_SLOW_THRESHOLD) || 1000
    },

    // Security settings
    sanitize: {
        enabled: true,
        fields: ['password', 'token', 'secret', 'authorization']
    },

    // Custom levels
    levels: logLevels
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'test') {
    config.directory = path.join(process.cwd(), 'logs', 'test');
    config.console.enabled = false;
}

if (process.env.NODE_ENV === 'development') {
    config.level = 'debug';
}

module.exports = config;