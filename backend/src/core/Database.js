class Database {
    static instance;
    
    constructor(config) {
      if (Database.instance) {
        return Database.instance;
      }
      this.config = config;
      Database.instance = this;
    }
  
    static getInstance() {
      if (!Database.instance) {
        throw new Error('Database not initialized');
      }
      return Database.instance;
    }
  
    async connect() {
      const { createConnection, initializeModels } = require('../config/database.config');
      this.connection = await createConnection(this.config);
      this.models = await initializeModels(this.connection);
      return this;
    }
  }
  
  module.exports = Database;