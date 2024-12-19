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
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            addedBy: {
                type: DataTypes.STRING(30),
                field: 'added_by',
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Template',
            tableName: 'templates'
        });
    }

    static associate(models) {
        this.hasMany(models.Task, {
            foreignKey: 'templateId',
            as: 'tasks'
        });
    }
}

export default Template;