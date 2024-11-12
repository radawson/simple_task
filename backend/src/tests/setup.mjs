// src/tests/setup.mjs
import { Sequelize } from 'sequelize';
import config from '../config/config.js';

const testConfig = config.test;

const testDb = new Sequelize(
    testConfig.database,
    testConfig.username,
    testConfig.password,
    {
        host: testConfig.host,
        dialect: testConfig.dialect,
        logging: false
    }
);

export default async () => {
    try {
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