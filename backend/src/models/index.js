import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import Logger from '../core/Logger.js';
import { getDirname, pathToFileURL } from '../utils/path.util.js';

const __dirname = getDirname(import.meta.url);
const logger = Logger.getInstance();

async function importModels() {
    const models = {};
    
    try {
        const files = await readdir(__dirname);
        const modelFiles = files.filter(file => 
            file.indexOf('.') !== 0 && 
            file !== 'index.js' &&
            file !== 'base.model.js' &&
            file.endsWith('.model.js')
        );

        for (const file of modelFiles) {
            try {
                // Get absolute path and convert to URL
                const modelPath = resolve(__dirname, file);
                const modelUrl = pathToFileURL(modelPath);
                
                logger.debug(`Loading model from: ${modelUrl}`);
                
                const modelModule = await import(modelUrl);
                const modelName = file.split('.')[0].split('-').map(
                    part => part.charAt(0).toUpperCase() + part.slice(1)
                ).join('');
                
                if (modelModule.default) {
                    models[modelName] = modelModule.default;
                } else {
                    Object.assign(models, modelModule);
                }
                
                logger.debug(`Loaded model: ${modelName}`);
            } catch (error) {
                logger.error(`Failed to load model ${file}: ${error.message}`, { 
                    file,
                    stack: error.stack 
                });
            }
        }
    } catch (error) {
        logger.error(`Failed to read models directory: ${error.message}`, { 
            stack: error.stack 
        });
    }

    return models;
}

// Export both the function and static model imports
export { importModels };
export default importModels;

// Export loaded models
export { default as Task } from './task.model.js';
export { default as Event } from './event.model.js';
export { User, Person } from './person.model.js';
export { default as Note } from './note.model.js';
export { default as Template } from './template.model.js';
export { default as Timecard } from './timecard.model.js';
export { default as Message } from './message.model.js';
export { default as Session } from './session.model.js';
export { default as Setting } from './setting.model.js';
export { default as Audit } from './audit.model.js';
export { default as Notification } from './notification.model.js';
export { default as Calendar } from './calendar.model.js';