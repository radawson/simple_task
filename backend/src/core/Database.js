import { createConnection, initializeModels } from '../config/database.config.js';
import Logger from './Logger.js';

class Database {
    static #instance;
    #connection;
    #config;
    #logger;
    #seedDb;

    constructor(config, seedDb = false) {
        if (Database.#instance) {
            return Database.#instance;
        }
        this.#config = config;
        this.#logger = Logger.getInstance();
        this.#seedDb = seedDb;
        Database.#instance = this;
    }

    setSeedFlag(value) {
        this.#seedDb = value;
    }

    async connect() {
        try {
            this.#connection = await createConnection(this.#config);
            
            const shouldForceSync = process.env.FORCE_DB_SYNC === 'true' &&
                process.env.NODE_ENV !== 'production';

            if (shouldForceSync) {
                this.#logger.info('Force syncing database...');
                await this.#connection.sync({ force: true });
            } else {
                await this.#connection.sync({ alter: true });
            }

            await initializeModels(this.#connection);

            if (this.#seedDb) {
                this.#logger.info('Seeding database...');
                const { Seeder } = await import('../utils/seed.util.js');
                await Seeder.seedDatabase();
                this.#logger.info('Database seeded');
            }

            this.#logger.info('Database connected and synced');
            return this;
        } catch (error) {
            this.#logger.error(`Database connection failed: ${error.message}`);
            throw error;
        }
    }

    async disconnect() {
        if (this.#connection) {
            await this.#connection.close();
            this.#logger.info('Database connection closed');
        }
    }

    getConnection() {
        if (!this.#connection) {
            throw new Error('Database not connected');
        }
        return this.#connection;
    }

    static getInstance() {
        if (!Database.#instance) {
            throw new Error('Database not initialized');
        }
        return Database.#instance;
    }
}

// Export both the class and a default instance
export { Database };  // Named export for the class itself
export default Database;  // Default export for consistency with existing code