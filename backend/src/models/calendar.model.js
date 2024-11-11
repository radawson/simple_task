import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Calendar extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM('personal', 'shared', 'resource'),
                defaultValue: 'personal'
            },
            color: DataTypes.STRING(7),
            isDefault: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_default'
            },
            owner: {
                type: DataTypes.STRING(30),
                allowNull: false
            },
            settings: {
                type: DataTypes.JSON,
                defaultValue: {}
            }
        }, {
            sequelize,
            modelName: 'Calendar',
            tableName: 'calendars'
        });
    }

    static associate(models) {
        this.hasMany(models.Event);
        this.belongsToMany(models.User, {
            through: 'calendar_users',
            foreignKey: 'calendar_id'
        });
    }
}

export default Calendar;