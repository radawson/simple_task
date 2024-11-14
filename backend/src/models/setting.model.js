import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Setting extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            key: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true
            },
            value: {
                type: DataTypes.JSON,
                allowNull: false
            },
            category: {
                type: DataTypes.STRING(50),
                defaultValue: 'system'
            },
            description: DataTypes.TEXT,
            modifiedBy: {
                type: DataTypes.STRING(30),
                field: 'modified_by'
            }
        }, {
            sequelize,
            modelName: 'Setting',
            tableName: 'settings'
        });
    }
}

export default Setting;