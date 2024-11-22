// scripts/seed.js
import config from '../src/config/index.js';
import { Database } from '../src/core/Database.js';
import { Seeder } from '../src/utils/seed.util.js';

const seed = async () => {
    try {
        // Initialize and connect to the database
        const db = new Database(config.database);
        await db.connect();

        // Run the seeding process
        await Seeder.seedDatabase();
        console.log('Seeding completed successfully.');

        // Disconnect from the database
        await db.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seed();