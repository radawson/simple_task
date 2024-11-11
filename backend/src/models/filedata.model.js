import BaseModel from './base.model.js';
import { DataTypes } from 'sequelize';

class Filedata extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            sender: {
                type: DataTypes.STRING,
                allowNull: false
            },
            receiver: {
                type: DataTypes.STRING,
                allowNull: false
            },
            hash: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            size: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            filename: {
                type: DataTypes.STRING,
                allowNull: true
            }
        }, {
            sequelize,
            modelName: 'Filedata',
            tableName: 'filedata',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['sender', 'receiver', 'hash']
                }
            ]
        });
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'sender',
            targetKey: 'username',
            as: 'senderUser'
        });
        this.belongsTo(models.User, {
            foreignKey: 'receiver',
            targetKey: 'username',
            as: 'receiverUser'
        });
    }
}

export default Filedata;