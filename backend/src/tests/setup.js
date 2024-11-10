const Logger = require('../core/Logger');

// Initialize logger before any imports
const logger = new Logger({
    level: 'error',
    directory: 'logs/test',
    maxFiles: '1d',
    format: 'simple'
});

const winston = require('winston');
require('winston-daily-rotate-file');
const { Sequelize } = require('sequelize');

// Initialize test database
const testDb = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

module.exports = async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    try {
        // Load models with test database
        const models = require('../models');
        await testDb.authenticate();
        await testDb.sync({ force: true });
        console.log('Test database synchronized');
    } catch (error) {
        console.error('Database sync failed:', error);
        throw error;
    }

    // Cleanup function
    return async () => {
        try {
            await testDb.close();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database:', error);
            throw error;
        }
    };
};