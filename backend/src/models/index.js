const fs = require('fs');
const path = require('path');
const Logger = require('../core/Logger');
const logger = Logger.getInstance();

const models = {};

// Load all model files
fs.readdirSync(__dirname)
    .filter(file => 
        file.indexOf('.') !== 0 && 
        file !== 'index.js' &&
        file !== 'base.model.js' &&
        file.endsWith('.model.js')
    )
    .forEach(file => {
        try {
            const model = require(path.join(__dirname, file));
            const modelName = file.split('.')[0].split('-').map(
                part => part.charAt(0).toUpperCase() + part.slice(1)
            ).join('');
            
            // Handle both class and function exports
            if (typeof model === 'function' && model.prototype && model.prototype.constructor) {
                models[modelName] = model;
            } else if (typeof model === 'object') {
                Object.assign(models, model);
            }
            
            logger.debug(`Loaded model: ${modelName}`);
        } catch (error) {
            logger.error(`Failed to load model ${file}: ${error.message}`);
        }
    });

// Export loaded models
module.exports = models;

// Export individual models for direct imports
module.exports.Task = require('./task.model');
module.exports.Event = require('./event.model');
module.exports.User = require('./person.model').User;
module.exports.Person = require('./person.model').Person;
module.exports.Note = require('./note.model');
module.exports.Template = require('./template.model');
module.exports.Timecard = require('./timecard.model');
module.exports.Message = require('./message.model');
module.exports.Session = require('./session.model');
module.exports.Setting = require('./setting.model');
module.exports.Audit = require('./audit.model');
module.exports.Notification = require('./notification.model');
module.exports.Calendar = require('./calendar.model');