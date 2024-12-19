import { Model } from 'sequelize';
import Logger from '../core/Logger.js';

const logger = Logger.getInstance();

class BaseModel extends Model {

    toJSON() {
        const values = super.toJSON();
        logger.debug('Model serialization:', {
            model: this.constructor.name,
            id: this.id,
            fields: Object.keys(values)
        });
        return values;
    }
}

export default BaseModel;