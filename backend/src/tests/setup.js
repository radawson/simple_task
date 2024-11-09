// src/tests/setup.js
const Logger = require('../core/Logger');
const winston = require('winston');
require('winston-daily-rotate-file');

// Add Jest globals
const { beforeAll, afterAll } = require('@jest/globals');

// Initialize logger before any other imports
new Logger({
    level: 'error',
    directory: 'logs/test',
    maxFiles: '1d',
    format: 'simple'
});

const { config } = require('../config');
const { db } = require('../models');

beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Ensure test database
    process.env.DB_NAME = 'stasks_test';
    
    try {
        await db.sync({ force: true });
        console.log('Test database synchronized');
    } catch (error) {
        console.error('Database sync failed:', error);
        throw error;
    }
});

afterAll(async () => {
    try {
        await db.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
        throw error;
    }
});