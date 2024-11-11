import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Template extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING(200),
                allowNull: false,
                unique: true
            },
            description: DataTypes.TEXT
        }, {
            sequelize,
            modelName: 'Template',
            tableName: 'templates'
        });
    }

    static associate(models) {
        if (models.Task) {
            this.belongsToMany(models.Task, {
                through: 'TaskTemplates',
                foreignKey: 'templateId',
                otherKey: 'taskId'
            });
        }
    }
}

export default Template;