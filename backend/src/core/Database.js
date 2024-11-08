const { createConnection, initializeModels } = require('../config/database.config');
const Logger = require('./Logger');

class Database {
    static #instance;
    #connection;
    #config;
    #logger;

    constructor(config) {
        if (Database.#instance) {
            return Database.#instance;
        }
        this.#config = config;
        this.#logger = Logger.getInstance();
        Database.#instance = this;
    }

    async connect() {
        try {
            this.#connection = await createConnection(this.#config);
            await initializeModels(this.#connection);
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

module.exports = Database;