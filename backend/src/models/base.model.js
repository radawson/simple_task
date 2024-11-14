import { Model } from 'sequelize';

class BaseModel extends Model {
    static init(attributes, options) {
        return super.init(attributes, {
            ...options,
            underscored: true,
            timestamps: true
        });
    }
}

export default BaseModel;