const BaseModel = require('./base.model');
const { DataTypes } = require('sequelize');

class Session extends BaseModel {
    static init(sequelize) {
        return super.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: 'user_id'
            },
            refreshToken: {
                type: DataTypes.STRING,
                allowNull: false,
                field: 'refresh_token'
            },
            ipAddress: {
                type: DataTypes.STRING,
                field: 'ip_address'
            },
            userAgent: {
                type: DataTypes.STRING,
                field: 'user_agent'
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'expires_at'
            },
            isValid: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                field: 'is_valid'
            }
        }, {
            sequelize,
            modelName: 'Session',
            tableName: 'sessions'
        });
    }

    static associate(models) {
        this.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
    }
}

module.exports = Session;