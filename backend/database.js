/**
 * Module to manage database connections based on environment configuration.
 * Supports MongoDB and PostgreSQL currently.
 * 
 * @module database
 */

const { DB_TYPE, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, NODE_ENV } = require('./config');
const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('./logger');

const db = {};

/**
 * Switches between MongoDB and PostgreSQL based on the DB_TYPE environment variable.
 */
switch (DB_TYPE) {
  case 'mongodb':
    mongoose.set('strictQuery', false);
    db.mongoose = mongoose;
    db.url = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    db.connect = () => mongoose.connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    break;

  case 'postgresql':
    const sequelizePostgres = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: 'postgres',
      logging: (msg) => logger.debug(msg),  // Enable debug logging for SQL statements
    });

    db.sequelize = sequelizePostgres;
    db.DataTypes = DataTypes;

    // Define models here, after sequelize initialization
  
    const Message = require('./models/message.model')(sequelizePostgres, DataTypes);
    const FileData = require('./models/filedata.model')(sequelizePostgres, DataTypes);
    const Task = require('./models/task.model')(sequelizePostgres, DataTypes);
    const User = require('./models/user.model')(sequelizePostgres, DataTypes);



    db.Message = Message;
    db.FileData = FileData;
    db.Task = Task;
    db.User = User;

    db.connect = async () => {
      try {
        await sequelizePostgres.authenticate();
        logger.info('Connected to PostgreSQL successfully.');

        // Sync models in development mode
        if (NODE_ENV === 'development') {
          await FileData.sync({ alter: true });
          logger.info('FileData table synced successfully.');

          await Message.sync({ alter: true });
          logger.info('Message table synced successfully.');

          await Task.sync({ alter: true });
          logger.info('Task table synced successfully.');

          await User.sync({ alter: true });
          logger.info('User table synced successfully.');

        }
      } catch (error) {
        logger.error('PostgreSQL connection error:', error);
      }
    };
    db.DataTypes = DataTypes;
    break;

    case 'sqlite':
      const sequelizeSQLite = new Sequelize({
        dialect: 'sqlite',
        storage: `${DB_NAME}.sqlite`,  // SQLite database file
        logging: (msg) => logger.debug(msg),  // Enable debug logging for SQL statements
      });
  
      db.sequelize = sequelizeSQLite;
      db.DataTypes = DataTypes;
  
      // Define models here, after sequelize initialization
      const SQLiteUser = require('./models/user.model')(sequelizeSQLite, DataTypes);
      const SQLiteMessage = require('./models/message.model')(sequelizeSQLite, DataTypes);
      const SQLiteFileData = require('./models/filedata.model')(sequelizeSQLite, DataTypes);
      const SQLiteTask = require('./models/task.model')(sequelizeSQLite, DataTypes);
  
      db.User = SQLiteUser;
      db.Message = SQLiteMessage;
      db.FileData = SQLiteFileData;
      db.Task = SQLiteTask;
  
      db.connect = async () => {
        try {
          await sequelizeSQLite.authenticate();
          logger.info('Connected to SQLite successfully.');
  
          // Sync models in development mode
          if (NODE_ENV === 'development') {  
            await SQLiteFileData.sync({ alter: true });
            logger.info('FileData table synced successfully.');

            await SQLiteMessage.sync({ alter: true });
            logger.info('Message table synced successfully.');

            await SQLiteTask.sync({ alter: true });
            logger.info('Task table synced successfully.');

            await SQLiteUser.sync({ alter: true });
            logger.info('User table synced successfully.');
          }
        } catch (error) {
          logger.error('SQLite connection error:', error);
        }
      };
      break;

  default:
    throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}`);
}

module.exports = db;