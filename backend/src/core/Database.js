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
        this.#setupHooks();
        Database.#instance = this;
    }

    async connect() {
        try {
            // 1. Create connection
            this.#connection = await createConnection(this.#config);

            // 2. Initialize models first
            // Disable foreign key checks for SQLite
            if (this.#config.type === 'sqlite') {
                await this.#connection.query('PRAGMA foreign_keys = OFF');
            }
            const models = await initializeModels(this.#connection);

            // 3. Apply hooks after models are initialized
            this.#applyHooks(models);

            // 4. Sync with careful options
            if (process.env.FORCE_DB_SYNC === 'true' && process.env.NODE_ENV !== 'production') {
                await this.#connection.sync({ force: true });
            } else {
                // For SQLite, use alter with safety checks
                const alterConfig = this.#config.type === 'sqlite' ?
                    { alter: { drop: false } } :
                    { alter: true };
                await this.#connection.sync(alterConfig);
            }

            // Re-enable foreign key checks
            if (this.#config.type === 'sqlite') {
                await this.#connection.query('PRAGMA foreign_keys = ON');
            }

            // 5. Seed if needed
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

    #applyHooks(models) {
        Object.values(models).forEach(model => {
            if (model.addHook) {
                model.addHook('beforeValidate', (instance, options) => {
                    this.#logger.debug('Validating model:', {
                        model: model.name,
                        data: instance.toJSON(),
                        transaction: options.transaction?.id
                    });
                });

                model.addHook('afterValidate', (instance, options) => {
                    this.#logger.debug('Validation complete:', {
                        model: model.name,
                        isValid: !instance.validationError,
                        errors: instance.validationError,
                        transaction: options.transaction?.id
                    });
                });

                // Add other hooks from #setupHooks
                Object.entries(this.hooks).forEach(([hookName, hookFn]) => {
                    model.addHook(hookName, hookFn);
                });
            }
        });
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

    #setupHooks() {
        this.hooks = {
            beforeCreate: (instance, options) => {
                this.#logger.debug('Creating record:', {
                    model: instance.constructor.name,
                    data: instance.toJSON(),
                    transaction: options.transaction?.id
                });
            },
            beforeUpdate: (instance, options) => {
                this.#logger.debug('Updating record:', {
                    model: instance.constructor.name,
                    id: instance.id,
                    changes: instance.changed(),
                    transaction: options.transaction?.id
                });
            },
            beforeDestroy: (instance, options) => {
                this.#logger.debug('Deleting record:', {
                    model: instance.constructor.name,
                    id: instance.id,
                    transaction: options.transaction?.id
                });
            },
            beforeBulkCreate: (instances, options) => {
                this.#logger.debug('Bulk creating records:', {
                    model: instances[0].constructor.name,
                    count: instances.length,
                    transaction: options.transaction?.id
                });
            }
        };
    }


    setSeedFlag(value) {
        this.#seedDb = value;
    }

}

// Export both the class and a default instance
export { Database };  // Named export for the class itself
export default Database;  // Default export for consistency with existing code