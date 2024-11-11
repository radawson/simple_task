import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Message extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            fromUser: {
                type: DataTypes.STRING(30),
                field: 'from_user',
                allowNull: false
            },
            toUser: {
                type: DataTypes.STRING(30),
                field: 'to_user',
                allowNull: false
            },
            read: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            readAt: {
                type: DataTypes.DATE,
                field: 'read_at'
            },
            type: {
                type: DataTypes.ENUM('direct', 'notification', 'system'),
                defaultValue: 'direct'
            }
        }, {
            sequelize,
            modelName: 'Message',
            tableName: 'messages',
            hooks: {
                beforeUpdate: (message) => {
                    if (message.changed('read') && message.read) {
                        message.readAt = new Date();
                    }
                }
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'from_user',
            targetKey: 'username',
            as: 'sender'
        });
        this.belongsTo(models.User, {
            foreignKey: 'to_user',
            targetKey: 'username',
            as: 'recipient'
        });
    }
}

export default Message;