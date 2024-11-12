import Seeder from '../src/utils/seed.util.js';

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