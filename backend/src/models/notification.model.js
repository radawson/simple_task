import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Notification extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            title: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            content: DataTypes.TEXT,
            priority: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            recipientType: {
                type: DataTypes.ENUM('user', 'group', 'all'),
                field: 'recipient_type',
                defaultValue: 'user'
            },
            recipient: DataTypes.STRING(50),
            read: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            expiresAt: {
                type: DataTypes.DATE,
                field: 'expires_at'
            }
        }, {
            sequelize,
            modelName: 'Notification',
            tableName: 'notifications',
            paranoid: true
        });
    }
}

export default Notification;