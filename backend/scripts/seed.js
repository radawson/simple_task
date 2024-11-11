const Logger = require('../src/core/Logger');

const logger = new Logger({
    level: 'info',
    directory: 'logs',
    maxFiles: '14d',
    format: 'simple'
});

require('dotenv').config();
const Seeder = require('../src/utils/seed.util');

async function seed() {
    try {
        const result = await Seeder.seedDatabase();
        console.log(result.message);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();